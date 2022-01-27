const { MessageAttachment } = require('discord.js')
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const Canvas = require('canvas');
const fetch = require('node-fetch');
const config = require('../config.json');
const GIFEncoder = require('gif-encoder-2');
const gifFrames = require('gif-frames');
let global_client;
Canvas.registerFont('./source/fonts/Comfortaa-Bold.ttf', { family: 'Comfortaa' });

async function Get_Statistics(client)
{
    try {
        // ! Можно просто передать кэш, либо создать из них map ?
        // TODO: При добавлении на новые сервера нет записи в конфиге, соответственно ошибка. Нужно брать данные о доступных гильдиях из кфг, либо синхронизировать кфг и кэш
        // const GUILDS_ID = await client.guilds.cache.map(g => g.id);
        const GUILDS_ID = await config.guilds.map(g => g.id);
        for (let i of GUILDS_ID)
        {
            const CURRENT_GUILD = await config.guilds.find(g => g.id == i);
            const STATISTIC_CHANNEL = await client.channels.cache.get(CURRENT_GUILD.channels.statistics);
            await Clear_Messages(STATISTIC_CHANNEL);
            const UPLAY_NAMES = await CURRENT_GUILD.players.map(p => p.uplay_name).sort();
            let map = new Map();
            await (async () => {
                for (let i of UPLAY_NAMES)
                {
                    let permanent = await CURRENT_GUILD.players.find(p => p.uplay_name == i).permanent_link;
                    let stats = await Get_Profiles(i, permanent);

                    // TODO: Вроде как хочу перманент закинуть в конфиг, возможно это делать нужно не здесь
                    CURRENT_GUILD.players.find(p => p.uplay_name == i).permanent_link = await stats.permanent_link;
                    // ! Если пользователь изменил ник в uplay, то меняем его ник в конфиге
                    let new_name = await stats.new_uplay_name;
                    if (i !== new_name)
                        CURRENT_GUILD.players.find(p => p.uplay_name == i).uplay_name = new_name;
                    await fs.writeFileSync('./config.json', JSON.stringify(config, null, '\t'));
                    // 
                    await map.set(i, stats)
                    let filename = await Make_Canvas(stats, CURRENT_GUILD);
                    await Send_Bage(filename, STATISTIC_CHANNEL);
                }
            })();
        }
    }
    catch (err) {
        console.log(err);
    }
}

async function Clear_Messages(channel)
{
    let current_date = Date.now();
    // toDO: get user count for limit
    let messages = await channel.messages.fetch({ limit: 5 });
    // Получаем разницу в днях между текущей и каждого сообщения в канале
    let dates_difference = [...messages.values()].map(el => Math.floor((current_date - el.createdTimestamp) / (1000 * 3600 * 24)));
    if (messages.size > 0)
    {
        if (Math.max(...dates_difference) < 14)
            await channel.bulkDelete(messages);
        else
            console.log("Сообщение слишком старое. Удалить невозможно.");
    }
}

async function Get_Profiles(uplay_name, permanent)
{
    let url;
    if (permanent === undefined)
        url = `https://r6.tracker.network/profile/pc/${uplay_name}`;
    else
        url = permanent;

    let stats = await axios.get(url).then(async res => {
        let Get_Data = async html => {
            let $ = await cheerio.load(html);
            let rank_img = $('#profile > div.trn-scont.trn-scont--swap > div.trn-scont__aside > div:nth-child(1) > div.trn-card__content.trn-card--light.pt8.pb8 > div:nth-child(2) > div:nth-child(1)').html();
            let rank_name = rank_img.slice(rank_img.indexOf("title") + 7, rank_img.lastIndexOf("\""));
            rank_img = rank_img.slice(rank_img.indexOf("http"), rank_img.indexOf("title") - 2);
            let mmr = $('#profile > div.trn-scont.trn-scont--swap > div.trn-scont__aside > div:nth-child(1) > div.trn-card__content.trn-card--light.pt8.pb8 > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2)').html();
            let avatar = $('#profile > div.trn-profile-header > div > div.trn-profile-header__main > div').html();
            avatar = avatar.slice(avatar.indexOf("http"), avatar.indexOf("\">"));
            let temp = $('#profile > div.trn-scont.trn-scont--swap > div.trn-scont__content > div.trn-scont__content.trn-card').html();
            let kd = temp;
            temp = temp.slice(temp.indexOf(`<div class="trn-defstat__value"`), temp.lastIndexOf(`</div>`));
            temp = temp.slice(temp.indexOf(`<img`), temp.indexOf(`</div>`));
            kd = kd.slice(kd.indexOf("PVPKDRatio"));
            kd = kd.slice(kd.indexOf("\n") + 1, kd.indexOf("</div>") - 1);
            let ops = [];
            let pattern = /https:\/\/.*.png/g;
            let links = temp.matchAll(pattern);
            pattern = /https:\/\/.*"/g;
            let permanent = $('#profile > div.trn-scont.trn-scont--swap > div.trn-scont__aside > div:nth-child(3)').html();
            permanent = pattern.exec(permanent)[0];
            permanent = permanent.slice(0, permanent.indexOf('"'));
            let new_uplay_name = $('#profile > div.trn-profile-header > div > div.trn-profile-header__main > h1 > span.trn-profile-header__name').html().trim();
            for (let i of links)
                ops.push(i[0]);

            let obj = {
                name: uplay_name,
                rank_img: rank_img,
                rank_name: rank_name,
                mmr: mmr,
                ops: ops,
                avatar: avatar,
                kd: kd,
                permanent_link: permanent,
                new_uplay_name: new_uplay_name
            };
            return obj;
        }
        return await Get_Data(res.data);
    });
    return stats;
}

async function Make_Canvas(stats, CURRENT_GUILD)
{
    const BACKGROUND_NAME = await CURRENT_GUILD.players.find(p => p.uplay_name === stats.name).bage.background;
    const BACKGROUND_FILE = await fs.readdirSync(`./source/bages/available`).find(file => file.startsWith(BACKGROUND_NAME));
    const BACKGROUND_TYPE = await BACKGROUND_FILE.slice(BACKGROUND_FILE.lastIndexOf('.') + 1);
    const BACKGROUND_DEFAULT = await fs.readdirSync(`./source/bages/available`).find(file => file.startsWith(`ui_playercard_0`));

    await Preload_Resources(stats);
    if (BACKGROUND_TYPE == "png")
    {
        const width = 512, height = 128;
        const canvas = await Canvas.createCanvas(width, height);
        const ctx = await canvas.getContext('2d');
        const canvas_background = await Canvas.loadImage(`./source/bages/available/${BACKGROUND_FILE}` || `./source/bages/available/${BACKGROUND_DEFAULT}`);
        const rank_image = await Canvas.loadImage(`./source/ranks/${stats.rank_name}.svg` || `./source/ranks/No Rank.svg`);
        const rank_position = await CURRENT_GUILD.players.find(p => p.uplay_name == stats.name).bage.rank_image_side || "right";
        const rank_image_size = await (rank_position == "right") ? height : -height;
        const name = stats.name;
        const statistic = `${stats.mmr} MMR    ${stats.rank_name}    ${stats.kd} kd`;
        const ops_header = 'Top Operators';
        const ops_icon_size = 20;
        const first_op = await Canvas.loadImage(`./source/operators/${stats.ops[0].slice(stats.ops[0].lastIndexOf('/') + 1, stats.ops[0].lastIndexOf('.'))}.png`);
        const second_op = await Canvas.loadImage(`./source/operators/${stats.ops[1].slice(stats.ops[1].lastIndexOf('/') + 1, stats.ops[1].lastIndexOf('.'))}.png`);
        const third_op = await Canvas.loadImage(`./source/operators/${stats.ops[2].slice(stats.ops[2].lastIndexOf('/') + 1, stats.ops[2].lastIndexOf('.'))}.png`);

        await ctx.drawImage(canvas_background, 0, 0, width, height);
        // Вставляем ранг
        if (rank_position == "right")
            await ctx.drawImage(rank_image, width - rank_image_size, 0, rank_image_size, rank_image_size);
        else if (rank_position == "left")
            await ctx.drawImage(rank_image, 0, 0, -rank_image_size, -rank_image_size);
        // Настройка текста
        ctx.font = '20px Comfortaa';
        ctx.fillStyle = await CURRENT_GUILD.players.find(p => p.uplay_name == stats.name).bage.text_color || "black";
        // Обводка бейджа
        ctx.strokeStyle = await CURRENT_GUILD.players.find(p => p.uplay_name == stats.name).bage.bage_border || "transparent";
        ctx.lineWidth = 2;
        await ctx.strokeRect(0, 0, width, height);
        // Обводка текста
        ctx.lineWidth = 1;
        ctx.strokeStyle = await CURRENT_GUILD.players.find(p => p.uplay_name == stats.name).bage.text_border || "transparent";
        await ctx.strokeText(name, (width - rank_image_size ) / 2 - ctx.measureText(name).width / 2, 30);
        await ctx.strokeText(statistic, (width - rank_image_size) / 2 - ctx.measureText(statistic).width / 2, 60);
        await ctx.strokeText(ops_header, (width - rank_image_size) / 2 - ctx.measureText(ops_header).width / 2, 90);
        // Сам текст
        await ctx.fillText(name, (width - rank_image_size) / 2 - ctx.measureText(name).width / 2, 30);
        await ctx.fillText(statistic, (width - rank_image_size) / 2 - ctx.measureText(statistic).width / 2, 60);
        await ctx.fillText(ops_header, (width - rank_image_size) / 2 - ctx.measureText(ops_header).width / 2, 90);
        await ctx.drawImage(first_op, (width - rank_image_size) / 2 - ops_icon_size / 2 - 10 - ops_icon_size, 100, ops_icon_size, ops_icon_size);
        await ctx.drawImage(second_op, (width - rank_image_size) / 2 - ops_icon_size / 2, 100, ops_icon_size, ops_icon_size);
        await ctx.drawImage(third_op, (width - rank_image_size) / 2 + ops_icon_size / 2 + 10, 100, ops_icon_size, ops_icon_size);
        // Аватарку можно вставить;
        await fs.writeFileSync(`./source/bages/current/${stats.name}.${BACKGROUND_TYPE}`, canvas.toBuffer());
        return await `${stats.name}.${BACKGROUND_TYPE}`;
    }
    else
    {
        await Create_Frames(BACKGROUND_FILE);
        // console.log('frames ready');
        await Make_Gif(stats, CURRENT_GUILD);
        await Delete_Frames();
        return await `${stats.name}.${BACKGROUND_TYPE}`;
    }
}

async function Create_Frames(BACKGROUND_FILE)
{
    let frame_data = await gifFrames({ url: `./source/bages/available/${BACKGROUND_FILE}`, frames: 'all', outputType: 'png', cumulative: true });
    await frame_data.forEach(async function (frame) {
        await frame.getImage().pipe(fs.createWriteStream(`./source/bages/frames/image-${frame.frameIndex}.png`));
    });
    await new Promise(r => setTimeout(r, 3000));
    /* await gifFrames(
		{ url: `./source/bages/available/${BACKGROUND_FILE}`, frames: 'all', outputType: 'png', cumulative: true },
		async function (err, frameData) {
			if (err)
				console.log(err);
			await frameData.forEach(async function (frame) {
				await frame.getImage().pipe(fs.createWriteStream(`./source/bages/frames/image-${frame.frameIndex}.png`));
			});
		}
    ); */
}

async function Make_Gif(stats, CURRENT_GUILD)
{
    const width = 512, height = 128;
    const canvas = await Canvas.createCanvas(width, height);
    const ctx = await canvas.getContext('2d');
    const encoder = await new GIFEncoder(width, height);
    const rank_position = await CURRENT_GUILD.players.find(p => p.uplay_name == stats.name).bage.rank_image_side;
    const rank_image_size = await (rank_position === "right") ? height : -height;
    const name = stats.name;
    const statistic = `${stats.mmr} MMR    ${stats.rank_name}    ${stats.kd} kd`;
    const rank_image = await Canvas.loadImage(`./source/ranks/${stats.rank_name}.svg`) || await Canvas.loadImage(`./source/ranks/No Rank.svg`);
    const ops_header = 'Top Operators';
    const ops_icon_size = 20;
    const first_op = await Canvas.loadImage(`./source/operators/${stats.ops[0].slice(stats.ops[0].lastIndexOf('/') + 1, stats.ops[0].lastIndexOf('.'))}.png`);
    const second_op = await Canvas.loadImage(`./source/operators/${stats.ops[1].slice(stats.ops[1].lastIndexOf('/') + 1, stats.ops[1].lastIndexOf('.'))}.png`);
    const third_op = await Canvas.loadImage(`./source/operators/${stats.ops[2].slice(stats.ops[2].lastIndexOf('/') + 1, stats.ops[2].lastIndexOf('.'))}.png`);
    // ctx.font = '20px Comfortaa-Bold';
    ctx.font = '20px Comfortaa';
    ctx.fillStyle = await CURRENT_GUILD.players.find(p => p.uplay_name == stats.name).bage.text_color || "black";

    let files = await fs.readdirSync('./source/bages/frames/').filter(file => file.endsWith('.png'));
    files.sort((a, b) => a - b);
    await encoder.start();
    for (let i of files)
    {
        const image = await Canvas.loadImage(`./source/bages/frames/${i}`);
        await ctx.drawImage(image, 0, 0, width, height);
        if (rank_position == "right")
            await ctx.drawImage(rank_image, width - rank_image_size, 0, rank_image_size, rank_image_size);
        else if (rank_position == "left")
            await ctx.drawImage(rank_image, 0, 0, -rank_image_size, -rank_image_size);
        // Обводка бейджа
        ctx.strokeStyle = await CURRENT_GUILD.players.find(p => p.uplay_name == stats.name).bage.bage_border || "transparent";
        ctx.lineWidth = 2;
        await ctx.strokeRect(0, 0, width, height);
        // Обводка текста
        ctx.lineWidth = 1;
        ctx.strokeStyle = await CURRENT_GUILD.players.find(p => p.uplay_name == stats.name).bage.text_border || "transparent";
        await ctx.strokeText(name, (width - rank_image_size ) / 2 - ctx.measureText(name).width / 2, 30);
        await ctx.strokeText(statistic, (width - rank_image_size) / 2 - ctx.measureText(statistic).width / 2, 60);
        await ctx.strokeText(ops_header, (width - rank_image_size) / 2 - ctx.measureText(ops_header).width / 2, 90);
        // Сам текст
        await ctx.fillText(name, (width - rank_image_size) / 2 - ctx.measureText(name).width / 2, 30);
        await ctx.fillText(statistic, (width - rank_image_size) / 2 - ctx.measureText(statistic).width / 2, 60);
        await ctx.fillText(ops_header, (width - rank_image_size) / 2 - ctx.measureText(ops_header).width / 2, 90);
        await ctx.drawImage(first_op, (width - rank_image_size) / 2 - ops_icon_size / 2 - 10 - ops_icon_size, 100, ops_icon_size, ops_icon_size);
        await ctx.drawImage(second_op, (width - rank_image_size) / 2 - ops_icon_size / 2, 100, ops_icon_size, ops_icon_size);
        await ctx.drawImage(third_op, (width - rank_image_size) / 2 + ops_icon_size / 2 + 10, 100, ops_icon_size, ops_icon_size);
        await encoder.addFrame(ctx);
    }
    await encoder.finish();
    await fs.writeFileSync(`./source/bages/current/${stats.name}.gif`, encoder.out.getData());
}

async function Delete_Frames()
{
    const files = await fs.readdirSync('./source/bages/frames/').filter(file => file.endsWith('.png'));;
    await files.forEach(async file => await fs.unlinkSync('./source/bages/frames/' + file));
}

async function Preload_Resources(stats)
{
    if (!fs.existsSync(`./source/ranks/${stats.rank_name}.svg`))
        await fetch(stats.rank_img).then(res => res.body.pipe(fs.createWriteStream(`./source/ranks/${stats.rank_name}.svg`)));
    if (!fs.existsSync(`./source/avatars/${stats.name}.png`))
        await fetch(stats.avatar).then(res => res.body.pipe(fs.createWriteStream(`./source/avatars/${stats.name}.png`)));

    for (let i of stats.ops)
    {
        let op = await i.slice(i.lastIndexOf('/') + 1, i.lastIndexOf('.'))
        if (!fs.existsSync(`./source/operators/${op}.png`))
            await fetch(i).then(res => res.body.pipe(fs.createWriteStream(`./source/operators/${op}.png`)));
    }
    // !
    /* setTimeout(() => {
        return callback();        
    }, 2000); */
}

async function Send_Bage(filename, STATISTIC_CHANNEL)
{
    let attachment = await new MessageAttachment(`./source/bages/current/${filename}`);
    await STATISTIC_CHANNEL.send({ files: [attachment] });
}

module.exports = Get_Statistics;
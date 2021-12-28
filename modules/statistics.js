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

function GetStatistics(client)
{
    // TODO: Нужно переписывать почти всё. Делать скан профиля по ссылке либо по нику, если в первый раз
    try {
        const channel = client.channels.cache.get(config.guilds[0].channels.statistics);
        ClearMessages(channel, function() {
            const uplay_names = config.guilds[0].players.map(person => person.uplay_name).sort();
            let map = new Map();
            for (let i = 0; i < uplay_names.length; i++)
            {
                GetProfiles(uplay_names[i], function(stats) {
                    // TODO: Вроде как хочу перманент закинуть в конфиг, возможно это делать нужно не здесь
                    config.guilds[0].players.find(person => person.uplay_name == uplay_names[i]).permanent_link = stats.permanent_link;
                    fs.writeFileSync('./config.json', JSON.stringify(config, null, '\t'));
                    // 
                    map.set(uplay_names[i], stats);
                    MakeCanvas(map.get(uplay_names[i]), async function(_name) {
                        // let file = await fs.readdirSync(`./source/bages/current`).filter(file => file.startsWith(uplay_names[i]))[0];
                        let attachment = new MessageAttachment(`./source/bages/current/${_name}`);
                        await client.channels.cache.get(config.guilds[0].channels.statistics).send({ files: [attachment] });
                    })
                })
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}

async function ClearMessages(channel, callback)
{
    let current_date = Date.now();
    // toDO: get user count for limit
    let messages = await channel.messages.fetch({limit: 5});
    // Получаем разницу в днях между текущей и каждого сообщения в канале
    let dates_difference = [...messages.values()].map(el => Math.floor((current_date - el.createdTimestamp) / (1000 * 3600 * 24)));
    if (messages.size > 0)
    {
        if (Math.max(...dates_difference) < 14)
            await channel.bulkDelete(messages);
        else
            console.log("Сообщение слишком старое. Удалить невозможно.");
    }
    return callback();
    /* try {
        if (messages.size > 0 && Math.max(...dates_difference) < 14)
            await channel.bulkDelete(messages);
        return callback();
    }
    catch (err) {
        console.log(err);
    } */
}

async function GetProfiles(uplay_name, callback)
{
    const url = `https://r6.tracker.network/profile/pc/${uplay_name}`;
    let stats = await axios.get(url).then(async res => {
        let GetData = async html => {
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
            console.log(permanent);
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
                permanent_link: permanent
            };
            return obj;
        }
        return await GetData(res.data);
    });
    // map.set(uplay_name, stats);
    // map.set(uplay_names[i], await ScrapSite(uplay_names[i]));
    return callback(stats);
}

async function MakeCanvas(map, callback)
{
    console.log(map)
    let background_name = config.guilds[0].players.find(p => p.uplay_name == map.name).bage.background;
    const background_file = await fs.readdirSync(`./source/bages/available`).filter(file => file.startsWith(background_name))[0];
    const background_type = background_file.slice(background_file.lastIndexOf('.') + 1);
    const background_default = await fs.readdirSync(`./source/bages/available`).filter(file => file.startsWith(`ui_playercard_0`))[0];
    PreloadResources(map, async function() {
        if (background_type == "png")
        {
            const width = 512, height = 128;
            const canvas = Canvas.createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            const canvas_background = await Canvas.loadImage(`./source/bages/available/${background_file}` || `./source/bages/available/${background_default}`);
            const rank_image = await Canvas.loadImage(`./source/ranks/${map.rank_name}.svg` || `./source/ranks/No Rank.svg`);
            const rank_position = config.guilds[0].players.find(p => p.uplay_name == map.name).bage.rank_image_side || "right";
            const rank_image_size = (rank_position == "right") ? height : -height;
            const name = map.name;
            const statistic = `${map.mmr} MMR    ${map.rank_name}    ${map.kd} kd`;
            const ops_header = 'Top Operators';
            const ops_icon_size = 20;
            const first_op = await Canvas.loadImage(`./source/operators/${map.ops[0].slice(map.ops[0].lastIndexOf('/') + 1, map.ops[0].lastIndexOf('.'))}.png`);
            const second_op = await Canvas.loadImage(`./source/operators/${map.ops[1].slice(map.ops[1].lastIndexOf('/') + 1, map.ops[1].lastIndexOf('.'))}.png`);
            const third_op = await Canvas.loadImage(`./source/operators/${map.ops[2].slice(map.ops[2].lastIndexOf('/') + 1, map.ops[2].lastIndexOf('.'))}.png`);

            ctx.drawImage(canvas_background, 0, 0, width, height);
            // Вставляем ранг
            if (rank_position == "right")
                await ctx.drawImage(rank_image, width - rank_image_size, 0, rank_image_size, rank_image_size);
            else if (rank_position == "left")
                await ctx.drawImage(rank_image, 0, 0, -rank_image_size, -rank_image_size);
            // Настройка текста
            // ctx.font = '20px';
            // ctx.font = '20px Courier';
            ctx.font = '20px Comfortaa';
            ctx.fillStyle = config.guilds[0].players.find(p => p.uplay_name == map.name).bage.text_color || "black";
            // Обводка текста
            ctx.strokeStyle = config.guilds[0].players.find(p => p.uplay_name == map.name).bage.text_border || "transparent";
            ctx.strokeText(name, (width - rank_image_size ) / 2 - ctx.measureText(name).width / 2, 30);
            ctx.strokeText(statistic, (width - rank_image_size) / 2 - ctx.measureText(statistic).width / 2, 60);
            ctx.strokeText(ops_header, (width - rank_image_size) / 2 - ctx.measureText(ops_header).width / 2, 90);
            // Сам текст
            ctx.fillText(name, (width - rank_image_size) / 2 - ctx.measureText(name).width / 2, 30);
            ctx.fillText(statistic, (width - rank_image_size) / 2 - ctx.measureText(statistic).width / 2, 60);
            ctx.fillText(ops_header, (width - rank_image_size) / 2 - ctx.measureText(ops_header).width / 2, 90);
            ctx.drawImage(first_op, (width - rank_image_size) / 2 - ops_icon_size / 2 - 10 - ops_icon_size, 100, ops_icon_size, ops_icon_size);
            ctx.drawImage(second_op, (width - rank_image_size) / 2 - ops_icon_size / 2, 100, ops_icon_size, ops_icon_size);
            ctx.drawImage(third_op, (width - rank_image_size) / 2 + ops_icon_size / 2 + 10, 100, ops_icon_size, ops_icon_size);
            // Аватарку можно вставить;
            await fs.writeFileSync(`./source/bages/current/${map.name}.${background_type}`, canvas.toBuffer());
            return callback(`${map.name}.${background_type}`);
        }
        else
        {
            CreateFrames(background_file, function() {
                MakeAGif(map, function() {
                    DeleteFrames(function() {
                        return callback(`${map.name}.${background_type}`);
                    })
                })
            })
        }
    })
}

async function PreloadResources(map, callback)
{
    if (!fs.existsSync(`./source/ranks/${map.rank_name}.svg`))
        await fetch(map.rank_img).then(res => res.body.pipe(fs.createWriteStream(`./source/ranks/${map.rank_name}.svg`)))
    if (!fs.existsSync(`./source/avatars/${map.name}.png`))
        await fetch(map.avatar).then(res => res.body.pipe(fs.createWriteStream(`./source/avatars/${map.name}.png`)))
    for (let i of map.ops)
    {
        let op = i.slice(i.lastIndexOf('/') + 1, i.lastIndexOf('.'))
        if (!fs.existsSync(`./source/operators/${op}.png`))
            await fetch(i).then(res => res.body.pipe(fs.createWriteStream(`./source/operators/${op}.png`)))
    }
    setTimeout(() => {
        return callback();        
    }, 2000);
    // return callback();
}

async function CreateFrames(background_file, callback)
{
	gifFrames(
		{ url: `./source/bages/available/${background_file}`, frames: 'all', outputType: 'png', cumulative: true},
		function (err, frameData) {
			if (err)
				console.log(err);
			frameData.forEach( function (frame) {
				frame.getImage().pipe(fs.createWriteStream(`./source/bages/frames/image-${frame.frameIndex}.png`));
			})
		});
    return callback();
}

async function MakeAGif(map, callback)
{
    const width = 512, height = 128;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const encoder = new GIFEncoder(width, height);
    const rank_position = config.guilds[0].players.find(p => p.uplay_name == map.name).bage.rank_image_side;
    const rank_image_size = (rank_position === "right") ? height : -height;
    const name = map.name;
    const statistic = `${map.mmr} MMR    ${map.rank_name}    ${map.kd} kd`;
    const rank_image = await Canvas.loadImage(`./source/ranks/${map.rank_name}.svg`) || await Canvas.loadImage(`./source/ranks/No Rank.svg`);
    const ops_header = 'Top Operators';
    const ops_icon_size = 20;
    const first_op = await Canvas.loadImage(`./source/operators/${map.ops[0].slice(map.ops[0].lastIndexOf('/') + 1, map.ops[0].lastIndexOf('.'))}.png`);
    const second_op = await Canvas.loadImage(`./source/operators/${map.ops[1].slice(map.ops[1].lastIndexOf('/') + 1, map.ops[1].lastIndexOf('.'))}.png`);
    const third_op = await Canvas.loadImage(`./source/operators/${map.ops[2].slice(map.ops[2].lastIndexOf('/') + 1, map.ops[2].lastIndexOf('.'))}.png`);
    // ctx.font = '20px Comfortaa-Bold';
    ctx.font = '20px Comfortaa';
    ctx.fillStyle = config.guilds[0].players.find(p => p.uplay_name == map.name).bage.text_color || "black";

    let sorted = [];
    let files = fs.readdirSync('./source/bages/frames/').filter(file => file.endsWith('.png'));
    console.log("files", files)
    files.forEach((file, i) => sorted.push(file.replace(/\d+/, i)));
    files = sorted;
    encoder.start();
    for (let i of files)
    {
        const image = await Canvas.loadImage(`./source/bages/frames/${i}`);
        ctx.drawImage(image, 0, 0, width, height);
        if (rank_position == "right")
            await ctx.drawImage(rank_image, width - rank_image_size, 0, rank_image_size, rank_image_size);
        else if (rank_position == "left")
            await ctx.drawImage(rank_image, 0, 0, -rank_image_size, -rank_image_size);
        // Обводка текста
        ctx.strokeStyle = config.guilds[0].players.find(p => p.uplay_name == map.name).bage.text_border || "transparent";
        ctx.strokeText(name, (width - rank_image_size ) / 2 - ctx.measureText(name).width / 2, 30);
        ctx.strokeText(statistic, (width - rank_image_size) / 2 - ctx.measureText(statistic).width / 2, 60);
        ctx.strokeText(ops_header, (width - rank_image_size) / 2 - ctx.measureText(ops_header).width / 2, 90);
        // Сам текст
        ctx.fillText(name, (width - rank_image_size) / 2 - ctx.measureText(name).width / 2, 30);
        ctx.fillText(statistic, (width - rank_image_size) / 2 - ctx.measureText(statistic).width / 2, 60);
        ctx.fillText(ops_header, (width - rank_image_size) / 2 - ctx.measureText(ops_header).width / 2, 90);
        ctx.drawImage(first_op, (width - rank_image_size) / 2 - ops_icon_size / 2 - 10 - ops_icon_size, 100, ops_icon_size, ops_icon_size);
        ctx.drawImage(second_op, (width - rank_image_size) / 2 - ops_icon_size / 2, 100, ops_icon_size, ops_icon_size);
        ctx.drawImage(third_op, (width - rank_image_size) / 2 + ops_icon_size / 2 + 10, 100, ops_icon_size, ops_icon_size);
        encoder.addFrame(ctx);
    }
    encoder.finish();
    fs.writeFileSync(`./source/bages/current/${map.name}.gif`, encoder.out.getData());
    return callback();
}

async function DeleteFrames(callback)
{
    const files = fs.readdirSync('./source/bages/frames/');
    files.forEach(file => fs.unlinkSync('./source/bages/frames/' + file));
    return callback();
}

module.exports = GetStatistics;
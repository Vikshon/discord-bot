const fs = require('fs');
const fetch = require('node-fetch');
const CONFIG = require('../config.json');
const vk_token = process.env.vk_token || require('../secret.json').vk_token;
let global_client;
let current_group;

async function Get_Post(client) {
    const GUILDS_ID = CONFIG.guilds.map(g => g.id);
    for (let ID of GUILDS_ID) {
        const CURRENT_GUILD = CONFIG.guilds.find(g => g.id == ID);
        let CURRENT_GUILD_GROUPS = CURRENT_GUILD.groups;
        CURRENT_GUILD_GROUPS.forEach(async GROUP => {
            let items = await fetch(`https://api.vk.com/method/wall.get?domain=${GROUP}&count=5&v=5.131&access_token=${process.env.vk_token || vk_token}`).then(data => data.json()).then(json => json.response.items);
            // let last_post = (items[0].is_pinned) ? items[1] : items[0];
            if (items[0].is_pinned)
                items.splice(0, 1);
            let last_post = items[0];

            let fl = 1;
            let attachments = [];
            fl = await Compare_Post(last_post, client, GROUP, CURRENT_GUILD);
            if (fl == 0)
                return false;
            if (last_post.attachments)
                attachments = await Get_Attachments(last_post);
            await Send_Post(last_post, attachments, GROUP, client, CURRENT_GUILD);
        })
    }
}

async function Compare_Post(last_post, client, GROUP, CURRENT_GUILD) {
    let messages = await client.channels.cache.get(CURRENT_GUILD.channels.news).messages.fetch({ limit: 15 });
    let post_text = last_post.text;
    let isAds = last_post.marked_as_ads;
    let edited = last_post.edited;
    let post_date = last_post.date * 1000;
    let current_date = Date.now();
    let hour_difference = Math.floor((current_date - post_date) / (1000 * 3600));
    // ! Зарефакторить, просто добавить ссылку в объект при парсинге -->
    let last_post_url = `https://vk.com/${GROUP}?w=wall${last_post.owner_id}_${last_post.id}`;

    let fl = 1;
    if (isAds || edited || hour_difference > 1)
        return fl = 0;
    
    // ! Может убрать эту проверку текста сообщений? Оставить просто проверку даты. Если сообщение старее часа, например, то и пропускаем его
    // ! ИЛИ можно проверять просто по ссылке на пост. Это так-то нормальная идея. Просто всегда её можно скидывать, типа ссылка на источник
    for (let msg of messages) {
        // ! Находим первую ссылку сообщения, что в новом формате будет ссылка на пост группы. Далее проверям ее с ссылкой на источник, если совпали, пост пропускаем
        let msg_post_url = msg[1].content.match(/https:\/\/.+/)[0];
        // console.log('[DEBUG] Comparing msg and post: ', msg[1].content == post_date || msg[1].content.startsWith(post_text))
        if (msg[1].content == post_date || msg[1].content.startsWith(post_text) || msg_post_url == last_post_url) {
            fl = 0;
            break;
        }
    }
    return fl;
}

async function Get_Attachments(last_post) {
    // console.log('[DEBUG] last_post:', last_post);
    let count = last_post.attachments.length;
    let links = [];
    for (let i = 0; i < count; i++)
    {
        let path = last_post.attachments[i].photo || last_post.attachments[i].video || last_post.attachments[i].doc || last_post.attachments[i].link;
        let type = last_post.attachments[i].type;
        // console.log(path);
        if (type == "photo")
        {
            let map = new Map();
            for (let i of path.sizes)
                map.set(i.height * i.width, i.url);
            let maxSize = Math.max(...map.keys());
            let url = map.get(maxSize);
            links.push(url);
        }
        else if (type == "video")
        {
            let url = await fetch(`https://api.vk.com/method/video.get?videos=${path.owner_id}_${path.id}_${path.access_key}&v=5.131&access_token=${process.env.vk_token || vk_token}`).then(data => data.json()).then(json => json.response.items[0].player);
            // Обрезаю ссылки, для нормального отображения в сообщении (с превью). Если ютуб, то одно, вк, другое, и тд.
            if (url.includes("youtube"))
            {
                url = url.replace("embed/", "watch?v=");
                url = url.replace("?__ref=vk.api", "");
            }
            else if (url.includes("video_ext.php"))
            {
                url = url.replace("_ext.php?oid=", "");
                url = url.replace("&id=", "_");
                url = url.slice(0, url.indexOf("&hash"));
            }
            links.push(url);
        }
        else if (type == "doc")
        {
            // if gif
            let url = await fetch(path.url).then(data => data.url);
            links.push(url);
        }
        else {
            console.log(type);
        }
    }
    return links;
}

async function Send_Post(last_post, attachments, GROUP, client, CURRENT_GUILD) {
    try {
        let last_post_url = `https://vk.com/${GROUP}?w=wall${last_post.owner_id}_${last_post.id}`;

        let msg = last_post.text || last_post.date * 1000;
        let attachments_str = `\n\n● Ссылки:\nИсточник: <${last_post_url}>\n`;
        if (msg.length + last_post_url.length + attachments.length > 1900) {
            let space_index = msg.slice(0, 1800).lastIndexOf(' ');
            msg = msg.slice(0, space_index);
            msg += `...\nПродолжение в источнике: <${last_post_url}>`;
            for (let a of attachments) {
                attachments_str += `${a}\n`;
                if (attachments_str.length > 1900) {
                    attachments_str = attachments_str.replace(`${a}`, '');
                    break;
                }
            }

            await client.channels.cache.get(CURRENT_GUILD.channels.news).send({ content: msg });
            await client.channels.cache.get(CURRENT_GUILD.channels.news).send({ content: attachments_str });
        }
        else {
            for (let a of attachments)
                attachments_str += `${a}\n`;
            
            msg += `${attachments_str}`;

            await client.channels.cache.get(CURRENT_GUILD.channels.news).send({ content: msg });
        }
    }
    catch (error) {
        console.log(error);
    }
}

module.exports = Get_Post;
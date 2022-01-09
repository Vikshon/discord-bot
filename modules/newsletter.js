const fs = require('fs');
const fetch = require('node-fetch');
const CONFIG = require('../config.json');
// const { vk_token } = process.env || require('../secret.json');
const vk_token = process.env.vk_token || require('../secret.json').vk_token;
let global_client;
let current_group;

function GetPosts(client)
{
    global_client = client;
    const groups = CONFIG.guilds[0].groups;
    groups.forEach(async name => {
        try {
            current_group = name;
            let items = await fetch(`https://api.vk.com/method/wall.get?domain=${name}&count=5&v=5.131&access_token=${process.env.vk_token || vk_token}`).then(data => data.json()).then(json => json.response.items)
            let last_post = items[0];
            if (items[0].is_pinned)
                last_post = items[1];
            // console.log(last_post);

            ComparePost(last_post, function() {
                GetAttachments(last_post, function(attachments) {
                    SendPost(attachments, last_post, function(result) {
                        // 
                    })
                })
            })
        }
        catch (error) {
            console.log(error)
        }
    });
}

async function ComparePost(last_post, callback)
{
    let messages = await global_client.channels.cache.get(CONFIG.guilds[0].channels.news).messages.fetch({ limit: 10 });
    let post_text = last_post.text;
    let isAds = last_post.marked_as_ads;
    let edited = last_post.edited ?? false;
    let post_date = last_post.date * 1000;
    let current_date = Date.now();
    let hour_difference = Math.floor((current_date - post_date) / (1000 * 3600));

    if (isAds || edited || hour_difference > 1)
        return false;

    let fl = 1;
    messages.forEach(msg => {
        // Либо проверять текст поста и сообщения так, либо может отправлять ссылки и текста двумя сообщениями, и проверять текст через includes
        if (msg.content == post_date || msg.content.startsWith(post_text)) {
            fl = 0;
            return false;
        }
    });
    if (fl == 0)
        return false;
    return callback();
}

async function GetAttachments(last_post, callback)
{
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
    return callback(links);
}

async function SendPost(attachments, last_post)
{
    try {
        let last_post_url = `https://vk.com/${current_group}?w=wall${last_post.owner_id}_${last_post.id}`;

        let msg = last_post.text || last_post.date * 1000;
        let attachments_str = `● Ссылки:\n`;
        if (msg.length + attachments.length > 1900) {
            let space_index = msg.slice(1850, 1900).lastIndexOf(' ');
            msg = msg.slice(0, space_index);
            msg += `...\nПродолжение в источнике: ${last_post_url}`;
            for (let a of attachments) {
                attachments_str += `${a}\n`;
                if (attachments_str.length > 1900) {
                    attachments_str = attachments_str.replace(`${a}`, '');
                    break;
                }
            }

            await global_client.channels.cache.get(CONFIG.guilds[0].channels.news).send({ content: msg });
            await global_client.channels.cache.get(CONFIG.guilds[0].channels.news).send({ content: attachments_str });
        }
        else {
            for (let a of attachments) {
                attachments_str += `${a}\n\n`;
            }
            if (attachments_str.length > 20)
                msg += `\n${attachments_str}`;

            await global_client.channels.cache.get(CONFIG.guilds[0].channels.news).send({ content: msg });
        }

        /* let message = last_post.text || last_post.date * 1000;
        if (message.length < 1900) {
            console.log(`attachments: ${attachments.length}`);
            if (attachments.length > 0)
                message += `\n\n● Ссылки:\n`;
            for (let a of attachments) {
                message += `${a}\n`;
                if (message.length >= 1990)
                message = message.replace(`${a}`, '');
                break;
            }
        } */

    }
    catch (error) {
        if (last_post.text.length > 2000)
            console.log('Слишком длинный текст!');
        else
            console.log(error);
    }
}

module.exports = GetPosts;
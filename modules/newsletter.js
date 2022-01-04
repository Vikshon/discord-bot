const fs = require('fs');
const fetch = require('node-fetch');
const config = require('../config.json');
// const { discord_token, vk_token } = process.env || require('../secret.json');
const discord_token = process.env.discord_token || require('../secret.json').discord_token;
const vk_token = process.env.vk_token || require('../secret.json').vk_token;
let global_client;

function GetPosts(client)
{
    global_client = client;
    const groups = config.guilds[0].groups;
    groups.forEach(async name => {
        try {
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
    let messages = await global_client.channels.cache.get(config.guilds[0].channels.news).messages.fetch({ limit: 1 });
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
            console.log(`https://api.vk.com/method/video.get?videos=${path.owner_id}_${path.id}_${path.access_key}&v=5.131&access_token=${process.env.vk_token || vk_token}`);
            let url = await fetch(`https://api.vk.com/method/video.get?videos=${path.owner_id}_${path.id}_${path.access_key}&v=5.131&access_token=${process.env.vk_token || vk_token}`).then(data => data.json()).response.items[0].player;
            // let url = data.response.items[0].player
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

async function SendPost(attachments, last_post, callback)
{
    try {
        if (last_post.text.length > 2000) {
            console.log('Слишком длинный текст!');
        }
        
        let str = "";
        for (let a of attachments)
            str += `${a}\n`;
        if (str.length > 0)
            str = `\n\n● Ссылки:\n` + str;
        await global_client.channels.cache.get(config.guilds[0].channels.news).send({content: (last_post.text || (last_post.date * 1000)) + str})
        /* if (attachments.length > 0)
        {
            let str = "\n\n● Ссылки:\n"
            for (let a of attachments)
                str += `${a},`
            str = str.replaceAll(',', '\n')
            await client.channels.cache.get(config.guilds[0].channels.news).send({content: (last_post.text || (last_post.date * 1000)) + str})
        }
        else
            await client.channels.cache.get(config.guilds[0].channels.news).send({content: last_post.text || (last_post.date * 1000)}) */
    }
    catch (error) {
        console.log(error);
    }
}

module.exports = GetPosts;
// module.exports = {
//     GetPosts
//     /* console.log(client);
//     let arr = [];
//     const guilds = await client.guilds.cache.find(x => arr.push(x))
//     console.log(arr)
//     const groups = config.
//     console.log(...config.guilds) */
// }
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const fetch = require('node-fetch');
const config = require('../config.json');
const { discord_token } = require('../secret.json');
let global_client;

function GetStatistics(client)
{
    try {
        const channel = client.channels.cache.get(config.guilds[0].channels.statistics);
        ClearMessages(channel, function() {
            const uplay_names = config.guilds[0].players.map(person => person.uplay_name).sort();
            GetProfiles(uplay_names, function(map) {
                MakeCanvas(map, function(result) {
                    // 
                })
            })
        });
    }
    catch (error) {
        console.log(error);
    }
}

async function ClearMessages(channel, callback)
{
    let messages = await channel.messages.fetch({limit: 1});
    if (messages.size > 0)
		await channel.bulkDelete(messages);
    return callback();
}

async function GetProfiles(uplay_names, callback)
{
    let map = new Map();
    
    for (let i = 0; i < uplay_names.length; i++)
    {
        const url = `https://r6.tracker.network/profile/pc/${uplay_names[i]}`;
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
                let links = temp.matchAll(pattern)
                for (let i of links)
                    ops.push(i[0]);

                let obj = {
                    rank_img: rank_img,
                    rank_name: rank_name,
                    mmr: mmr,
                    ops: ops,
                    avatar: avatar,
                    kd: kd
                };
                return obj;
            }
            return await GetData(res.data);
        });
        map.set(uplay_names[i], stats);
        // map.set(uplay_names[i], await ScrapSite(uplay_names[i]));
    }
    return callback(map);
}

async function MakeCanvas(map, callback)
{
    console.log(map[0])
    for (let i = 0; i < map.size; i++)
    {
        console.log(map[i].name)
        const background_file = fs.readdirSync(`./source/bages/available`).filter(file => file.startsWith(config.guilds[0].players[map[i].name].bage.background))[0];
    }
}

module.exports = GetStatistics;
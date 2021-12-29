/* const { MessageAttachment } = require('discord.js')
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const Canvas = require('canvas');
const fetch = require('node-fetch');
const config = require('../config.json');
const GIFEncoder = require('gif-encoder-2');
const gifFrames = require('gif-frames');
let global_client;
Canvas.registerFont('./source/fonts/Comfortaa-Bold.ttf', { family: 'Comfortaa' }); */

function Get_Statistics(client)
{
    try {
        // ! Можно просто передать кэш, либо создать из них map ?
        const GUILDS_ID = client.guilds.cache.map(g => g.id);
        console.log(GUILDS_ID);
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = Get_Statistics;
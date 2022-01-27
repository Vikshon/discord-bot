const fs = require('fs');
const CONFIG = require('../config.json');
async function Get_Data(params)
{
    await Create_Players_Config();
    let file = await Get_Preview_Background(params);
    // TODO: Нужно в конфиг записывать стату игроков, чтобы передавать её на сайт и там выводить персональную инфу. Пока что обойдёмся случайной
    let data = [file, params, await fs.readdirSync(__dirname + '/../source/bages/available/')];
    return data;
    //// return await fs.readdirSync(__dirname + '/../source/bages/available/');
}

// Функция создает дубликат config.json в публичной папке для express. Необходимо, т.к. в html файлах express можно использовать только файлы из публичных папок 
function Create_Players_Config()
{
    // deep copy
    let player_config = JSON.parse(JSON.stringify(CONFIG.guilds));
    for (let g of player_config) {
        delete g.name;
        delete g.groups;
        delete g.channels;
    }

    fs.writeFileSync('./source/player_config.json', JSON.stringify(player_config, null, '\t'));
}

function Get_Preview_Background(params)
{
    try {
        // ! Добавить исключение, если пользователя нет в конфиге
        let guild_id = Object.values(params)[0].slice(0, Object.values(params)[0].lastIndexOf('_'));
        let player_id = Object.values(params)[0].slice(Object.values(params)[0].lastIndexOf('_') + 1);
    
        let filename = CONFIG.guilds.find(g => g.id == guild_id).players.find(p => p.discord_id == player_id).bage.background;
        let file = fs.readdirSync('./source/bages/available/').filter(file => file.startsWith(filename));
        
        return file;        
    }
    catch(err) {
        // console.log(err);
        console.log('Error. Sending default background...');
        return 'ui_playercard_0.png';
    }
}

async function Update_Config(params)
{
    let { settings, query } = params;
    try {
        let current_player = CONFIG.guilds.find(g => g.id == query.guild_id).players.find(p => p.discord_id == query.player_id);
        current_player.bage = settings.bage;
        await fs.writeFileSync('./config.json', JSON.stringify(CONFIG, null, '\t'));
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = () => {
    const express = require('express');
    const bodyParser = require('body-parser');
    const app = express();
    const port = process.env.PORT || 3000;
    const adress = process.env.adress || `http://localhost:${port}`;
    app.use(express.static(__dirname + '/../source'));
    app.set('views', __dirname + '/../source/views');
    app.set('view engine', 'pug');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/', async (req, res) => {
        res.render('index', { title: 'R6NEWSPAPER', data: await Get_Data(req.query) });
    });
    
    app.post('/save', async (req, res) => {
        console.log(req.body);
        await Update_Config(req.body);
        // Не очень нужно, но пусть пока будет
        await res.redirect('back');
    });
    
    app.listen(port, () => console.log(`Example app listening at ${adress}`));
}
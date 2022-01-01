const fs = require('fs');
const CONFIG = require('../config.json');
async function Get_Data(params)
{
    // TODO: Нужно в конфиг записывать стату игроков, чтобы передавать её на сайт и там выводить персональную инфу. Пока что обойдёмся случайной
    let data = [params, await fs.readdirSync(__dirname + '/../source/bages/available/')];
    return data;
    //// return await fs.readdirSync(__dirname + '/../source/bages/available/');
}

async function Update_Config(params)
{
    try {
        let current_player = CONFIG.guilds.find(g => g.id == params.current_guild).players.find(p => p.uplay_name == params.uplay_name);
        delete params.current_guild;
        delete params.uplay_name;
        current_player.bage = params;
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
    app.use(express.static(__dirname + '/../source'));
    app.set('views', __dirname + '/../source/views');
    app.set('view engine', 'pug');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/', async (req, res) => {
        res.render('index', { title: 'Document', data: await Get_Data(req.query) });
    });
    
    app.post('/save', async (req, res) => {
        console.log(req.body);
        await Update_Config(req.body);
        await res.redirect('back');
    });
    
    app.listen(port, () => console.log(`Example app listening at https://localhost:${port}`));
}
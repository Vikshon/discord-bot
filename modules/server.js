const fs = require('fs');
async function Get_Data(params)
{
    // TODO: Нужно в конфиг записывать стату игроков, чтобы передавать её на сайт и там выводить персональную инфу. Пока что обойдёмся случайной
    let data = [params, await fs.readdirSync(__dirname + '/../source/bages/available/')];
    return data;
    //// return await fs.readdirSync(__dirname + '/../source/bages/available/');
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
        res.render('index', { title: 'Document', data: await Get_Data(req.params) });
    });
    
    app.post('/save', async (req, res) => {
        console.log(req.body);
        await res.redirect('back')
    });
    
    /* app.get('/save', async (req, res) => {
        await fs.writeFileSync('./TEST.TXT', 'string1');
        await res.redirect('back');
    }); */
    
    app.listen(port, () => console.log(`Example app listening at https://localhost:${port}`));
}
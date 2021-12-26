const fs = require('fs');
async function GetNames()
{
    /* let arr = [];
    arr.push(await fs.readdirSync(__dirname + '/../source/bages/available/'));
    arr.push('test');
    return arr; */
    return await fs.readdirSync(__dirname + '/../source/bages/available/');
}

module.exports = () => {
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 3000;
    app.use(express.static(__dirname + '/../source'));
    app.set('views', __dirname + '/../source/views');
    app.set('view engine', 'pug');

    app.get('/', async (req, res) => res.render('index', { title: 'Document', data: await GetNames() }));
    
    app.listen(port, () => console.log(`Example app listening at https://localhost:${port}`));
}
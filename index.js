// MODULES
const server = require('./modules/server.js')();
const { MessageAttachment, Client, Intents, Message } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const commands = require('./modules/load_commands.js')(client);
const fs = require('fs');
const newsletter = require('./modules/newsletter.js');
const statistics = require('./modules/statistics.js');
// const secret = require('./secret.json');
//

client.on('ready', () => {
    console.log('Ready!');
    // console.log(client.commands)

    statistics(client);
    setInterval(() => {
        newsletter(client);
    }, 1000 * 5);
    setInterval(() => {
        statistics(client);
    }, 1000 * 60);
});

client.on('interactionCreate', async interaction => {
    // TODO: Отсавить просто return
    // TODO: Сделать ссылки на профили в json постоянными. То есть, при добавлении нового юзера можно пробивать его permanent link в r6tracker и записывать в json
    if (!interaction.isCommand()) return await interaction.reply({ content: 'Не является командой', ephemeral: true });
    if (!client.commands.has(interaction.commandName)) return await interaction.reply({ content: 'Команды не существует', ephemeral: true });

    try {
		await client.commands.get(interaction.commandName).execute(interaction);
	}
	catch (error) {
		console.error(error);
		await interaction.reply({ content: 'Данной команды не существует!', ephemeral: true });
    }
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return
    const op_name = interaction.message.content;
    /* await interaction.reply({content: `Оператвник Thorn.\nСторона: боец защиты\nРоль: защита объекта\nЗдоровье: 2/3 | Скорость 2/3\nСнаряжение:\n\t1) ПП UZK50GI / Дробовик M870\n\t2) Пистолет 1911 TACOPS / МИНИ-ПП C75 Auto\n\t3) Стационарный щит / Колючая проволока\n\t4) Снаряд "RAZORBLOOM" - Thorn выстреливает снарядами "Razorbloom", после чего они прилипают к поверхностям. Когда к этому месту приближается противник, снаряд выпускает смертоносные лезвия по всем направлениям.\n\nСсылки: <https://www.youtube.com/watch?time_continue=95&v=EkaGYQTpfLA&feature=emb_logo&ab_channel=IGN>`}); */
    await interaction.reply({content: `Карта VILLA.\nСсылки:\n<https://www.ubisoft.com/ru-ru/game/rainbow-six/siege/game-info/maps/villa>\n<https://www.youtube.com/watch?v=DXOnguMP1fU&ab_channel=UbisoftNorthAmerica>`});


    /* let userId = interaction.user.id
	let customId = interaction.customId.slice(0, interaction.customId.lastIndexOf('.'))
    let count = await fs.readdirSync('./source/bages/available').length
    console.log(count);
    await interaction.reply({content: `Вы успешно поменяли фон на ${customId}`, ephemeral: true}) */
})

client.on('messageCreate', async msg => {
    if (msg.content === "data")
        await msg.reply("base");
})

client.login(process.env.discord_token || require('./secret.json').discord_token);
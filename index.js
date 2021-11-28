// MODULES
const server = require('./modules/server.js')();
const { MessageAttachment, Client, Intents, Message } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const commands = require('./modules/load_commands.js')(client);
const fs = require('fs');
const { registerFont } = require('canvas');
// const secret = require('./secret.json');
//

client.on('ready', () => {
    console.log('Ready!');

    /* setInterval(() => {
        require('./modules/newsletter.js')(client);
    }, 1000 * 5); */
    setInterval(() => {
        require('./modules/statistics.js')(client);
    }, 1000 * 10);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (!client.commands.has(interaction.commandName)) return;

    try {
		await client.commands.get(interaction.commandName).execute(interaction);
	}
	catch (error) {
		console.error(error);
		await interaction.reply({ content: 'Данной команды не существует!', ephemeral: true });
    }
})

client.on('messageCreate', async msg => {
    if (msg.content === "data")
        await msg.reply("base");
})

client.login(process.env.discord_token || require('./secret.json').discord_token);
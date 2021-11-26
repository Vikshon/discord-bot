const { Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const clientID = require('../config.json').client.id;

const rest = new REST({ version: '9' }).setToken(process.env.discord_token || require('../secret.json').discord_token);
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); // Почему путь до папки указывается как ./ ?

module.exports = client => {
    client.commands = new Collection();

    for (let file of commandFiles) {
        let command = require(`./../commands/${file}`);
        commands.push(command.data.toJSON());
		client.commands.set(command.data.name, command);
    }

    (async () => {
        try {
			// for a guild -->
			/* await rest.put(
				Routes.applicationGuildCommands(clientID, guildId),
				{ body: commands },
	    	); */

			//global -->
			await rest.put(
				Routes.applicationCommands(clientID),
				{ body: commands },
			);

			console.log('Successfully reloaded application (/) commands.')
        }
        catch (error) {
            console.log(error)
        }
    })();
}
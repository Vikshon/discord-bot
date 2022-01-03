const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const fetch = require('node-fetch');
let config = require('../config.json');
const { vk_token } = process.env.vk_token || require('../secret.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('groups')
		.setDescription('groups description')
		.addSubcommand(sc =>
            sc
                .setName('list')
                .setDescription('Показывает список текущих групп'))
        .addSubcommand(sc =>
            sc
                .setName('add')
                .setDescription('Добавляет группу в список')
                .addStringOption(option =>
                    option
                        .setName('ссылка')
                        .setDescription('Полная ссылка на группу')
                        .setRequired(true))
		)
		.addSubcommand(sc =>
            sc
                .setName('remove')
                .setDescription('Удаляет группу из списка')
                .addStringOption(option =>
                    option
                        .setName('имя')
                        .setDescription('Имя группы в списке')
                        .setRequired(true))
		),
	async execute(interaction) {
		if (interaction.options.getSubcommand() === "list")
		{
			let groups = config.guilds[0].groups;
			return await interaction.reply({content: `Группы, которые бот мониторит в данный момент: ${groups}`});
		}
		else if (interaction.options.getSubcommand() === "add")
		{
			let url = interaction.options.getString('ссылка');
			let name = url.slice(url.lastIndexOf('/') + 1);
			let groups = config.guilds[0].groups;
			let items = await fetch(`https://api.vk.com/method/wall.get?domain=${name}&count=5&v=5.131&access_token=${process.env.vkToken || vk_token}`).then(data => data.json()).then(json => json.response.items.filter(i => !i.is_pinned));
			if (items.length < 1)
				return await interaction.reply({content: `Ошибка! Проверь корректность ссылки. Пример рабочей ссылки: <https://vk.com/r6siege> или vk.com/r6siege`, ephemeral: true});
			if (groups.includes(name))
				return await interaction.reply({content: `Ошибка! Данная группа уже мониторися`, ephemeral: true});
            // console.log()
			config.guilds[0].groups.push(name);
            // fs.writeFileSync('../config.json', JSON.stringify(config, null, '\t'));
            fs.writeFile('./config.json', JSON.stringify(config, null, '\t'), async function() {
                return await interaction.reply({content: `Группа ${name} успешно добавлена в мониторинг!`});
            });
		}
		else if (interaction.options.getSubcommand() === "remove")
		{
			let name = interaction.options.getString('имя');
			let groups = config.guilds[0].groups;
			if (!groups.includes(name))
				return await interaction.reply({content: `Ошибка! Данная группа не мониторится ботом`, ephemeral: true});
			if (groups.length < 1)
				return await interaction.reply({content: `Ошибка! Список пуст`, ephemeral: true});
			config.guilds[0].groups.splice(config.guilds[0].groups.indexOf(name), 1);
            fs.writeFile('./config.json', JSON.stringify(config, null, '\t'), async function() {
                return await interaction.reply({content: `Группа ${name} удалена из мониторинга!`});
            });
		}
	},
}
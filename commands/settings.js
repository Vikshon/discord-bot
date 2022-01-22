const { SlashCommandBuilder } = require('@discordjs/builders');
const CONFIG = require('../config.json');
const port = process.env.PORT || 3000;
const adress = process.env.adress || `http://localhost:${port}`;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Персонализировать бейдж'),
	async execute(interaction) {
        let personal_link = adress;
        const EVENT_GUILD_ID = interaction.guildId;
        const EVENT_USER_ID = interaction.user.id;
        let link_params = `?q=${EVENT_GUILD_ID}_${EVENT_USER_ID}`;
        personal_link += link_params;
		await interaction.reply({ content: `Перейди по ссылке для редактирования: ${personal_link}`, ephemeral: true });
	},
};
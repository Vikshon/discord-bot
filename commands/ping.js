const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Отвечает Pong!'),
	async execute(interaction) {
		await interaction.reply({ content: 'Pong!😊', ephemeral: true });
	},
};
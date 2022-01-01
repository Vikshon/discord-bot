const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Останавливает работу бота'),
	async execute(interaction) {
		await interaction.reply({ content: 'Бот выключен!', ephemeral: true });
	},
};
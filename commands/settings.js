const { SlashCommandBuilder } = require('@discordjs/builders');
const CONFIG = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Персонализировать бейдж'),
	async execute(interaction) {
        // TODO: Ссылка должна быть на сайт хоста, а не локальный
        let personal_link = "http://localhost:3000";
        const EVENT_GUILD_ID = interaction.guildId;
        const EVENT_USER_ID = interaction.user.id;
        const CURRENT_GUILD = CONFIG.guilds.find(guild => guild.id == EVENT_GUILD_ID);
        const CURRENT_USER = CURRENT_GUILD.players.find(person => person.discord_id == EVENT_USER_ID);
        // TODO: Добавить постоянную ссылку на профили в конфиг
        let link_params = `?uplay_name=${CURRENT_USER.uplay_name}&background=${CURRENT_USER.bage.background}&text_color=${CURRENT_USER.bage.text_color}&text_border=${CURRENT_USER.bage.text_border}&rank_image_side=${CURRENT_USER.bage.rank_image_side}`;
        personal_link += link_params;
		await interaction.reply({ content: `Перейди по ссылке для редактирования: ${personal_link}`, ephemeral: true });
	},
};
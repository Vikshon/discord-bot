const fs = require('fs');
const CONFIG = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mt')
		.setDescription('Мониторинг статистики r6')
        .addSubcommand(sc =>
            sc
                .setName('addme')
                .setDescription('Добавляет ваш профиль в список')
                .addStringOption(option =>
                    option
                        .setName('имя')
                        .setDescription('Имя аккаунта')
                        .setRequired(true))
		)
        .addSubcommand(sc =>
            sc
                .setName('deleteme')
                .setDescription('Удаляет ваш профиль из списка')
		)
        .addSubcommand(sc =>
            sc
                .setName('list')
                .setDescription('Выводит список')
		),
	async execute(interaction) {
        const CURRENT_GUILD = CONFIG.guilds.find(g => g.id == interaction.guildId);
        if (interaction.options.getSubcommand() === "list")
        {
            return await interaction.reply({ content: CURRENT_GUILD.players.map(p => p.uplay_name).toString() });
        }
        else if (interaction.options.getSubcommand() === "addme")
        {
            const CURRENT_USER_ID = interaction.user.id;
            const NAME = interaction.options.getString('имя');
            if (CURRENT_GUILD.players.find(p => p.discord_id == CURRENT_USER_ID))
                return await interaction.reply({ content: 'Ваш профиль уже отслеживается ⛔', ephemeral: true });
            const NEW_PLAYER = {
                discord_name: interaction.user.username,
                discord_id: CURRENT_USER_ID,
                uplay_name: NAME,
                bage: {
                    background: "ui_playercard_0",
                    rank_image_side: "right",
                    text_color: "#000000",
                    text_border: "transparent",
                    bage_border: "transparent"
                }
            };
            CURRENT_GUILD.players.push(NEW_PLAYER);
            await fs.writeFileSync('./config.json', JSON.stringify(CONFIG, null, '\t'));
            return await interaction.reply({ content: 'Ваш профиль успешно добавлен ✅', ephemeral: true });
        }
        else if (interaction.options.getSubcommand() === "deleteme")
        {
            const CURRENT_USER_ID = interaction.user.id;
            if (!CURRENT_GUILD.players.find(p => p.discord_id == CURRENT_USER_ID))
                return await interaction.reply({ content: 'Ваш профиль не отслеживается в данный момент⛔', ephemeral: true });
            CURRENT_GUILD.players = CURRENT_GUILD.players.filter(p => p.discord_id != CURRENT_USER_ID);
            console.log(CURRENT_GUILD);
            await fs.writeFileSync('./config.json', JSON.stringify(CONFIG, null, '\t'));
            return await interaction.reply({ content: 'Ваш профиль успешно удалён ✅', ephemeral: true });
        }
	},
};
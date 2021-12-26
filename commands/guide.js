const { MessageActionRow, MessageButton, MessageAttachment } = require("discord.js");
const fs = require('fs');
var config = require('../config.json');
const fetch = require('node-fetch');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('guide')
		.setDescription('guides')
        .addSubcommand(sc =>
            sc
                .setName('ops')
                .setDescription('Выводит список доступных оперативников')
		)
        .addSubcommand(sc =>
            sc
                .setName('maps')
                .setDescription('Выводит список доступных карт')
		),
	async execute(interaction) {
        if (interaction.options.getSubcommand() === "ops")
        {
            if (!fs.existsSync('./source/test/ops.json') || fs.readdirSync('./source/test').length < 1)
                return interaction.reply("Список оперативников пуст");
            const ops = require('../source/test/ops.json').ops;
            await interaction.reply({content: "Список доступных оперативников:"});
            for (let i of ops)
            {
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId(i)
                            .setLabel('Выбрать')
                            .setStyle('PRIMARY'),
                    )
                await interaction.channel.send({content: i, components: [row]});
            }
        }
        else if (interaction.options.getSubcommand() === "maps")
        {
            if (!fs.existsSync('./source/test/maps.json') || fs.readdirSync('./source/test').length < 1)
                return interaction.reply("Список карт пуст");
            const ops = require('../source/test/maps.json').maps;
            await interaction.reply({content: "Список доступных карт:"});
            for (let i of ops)
            {
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId(i)
                            .setLabel('Выбрать')
                            .setStyle('PRIMARY'),
                    )
                await interaction.channel.send({content: i, components: [row]});
            }
        }
	},
};
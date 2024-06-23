const { SlashCommandBuilder } = require('@discordjs/builders');
const settings = require('../../set/settings');
const fs = require('fs').promises;
const path = require('path');

// 寫入設置數據
async function writeSettings(newSettings) {
    const settingsPath = path.resolve(__dirname, '../../set/settings.js');
    const settingsContent = `module.exports = ${JSON.stringify(newSettings, null, 4)};`;
    await fs.writeFile(settingsPath, settingsContent, 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setcounting')
        .setDescription('設置計數頻道和起始數字')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('計數頻道')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('startnumber')
                .setDescription('起始數字')
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const startNumber = interaction.options.getInteger('startnumber');

        settings.countingChannelId = channel.id;
        settings.startingNumber = startNumber;

        await writeSettings(settings);

        await interaction.reply({ content: `計數頻道已設置為 ${channel}，起始數字為 ${startNumber}。`, ephemeral: true });
    },
};
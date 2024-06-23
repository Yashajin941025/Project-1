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
        .setName('setlog')
        .setDescription('設置日誌頻道和需要監聽的事件')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('日誌頻道')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('events')
                .setDescription('需要監聽的事件')
                .setRequired(true)
                .addChoices(
                    { name: '編輯文字', value: 'messageUpdate' },
                    { name: '刪除文字', value: 'messageDelete' },
                    { name: '發送圖片', value: 'messageImage' }
                )),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const events = interaction.options.getString('events').split(',');

        settings.logChannelId = channel.id;
        settings.logEvents = events;

        await writeSettings(settings);

        await interaction.reply({ content: `日誌頻道已設置為 ${channel}，監聽事件為 ${events.join(', ')}。`, ephemeral: true });
    },
};
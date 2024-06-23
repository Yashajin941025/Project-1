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
        .setName('warnsetting')
        .setDescription('設置警告次數限制')
        .addIntegerOption(option =>
            option.setName('mute3times')
                .setDescription('設置收到警告3次禁言的時間（小時）')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('mute5times')
                .setDescription('設置收到警告5次禁言的時間（天）')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('ban6times')
                .setDescription('設置收到警告6次封禁的時間（天）')
                .setRequired(false)),
    async execute(interaction) {
        const mute3Times = interaction.options.getInteger('mute3times');
        const mute5Times = interaction.options.getInteger('mute5times');
        const ban6Times = interaction.options.getInteger('ban6times');

        if (mute3Times !== null) {
            settings.muteDurations[3] = mute3Times * 60 * 60 * 1000; // 轉換為毫秒
        }
        if (mute5Times !== null) {
            settings.muteDurations[5] = mute5Times * 24 * 60 * 60 * 1000; // 轉換為毫秒
        }
        if (ban6Times !== null) {
            settings.banAfterWarnings = ban6Times;
        }

        await writeSettings(settings);

        await interaction.reply({ content: '警告次數限制已更新。', ephemeral: true });
    },
};
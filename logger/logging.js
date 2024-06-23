const { Events, EmbedBuilder } = require('discord.js');
const settings = require('../set/settings');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        if (!settings.logEvents.includes('messageUpdate')) return;

        const logChannel = oldMessage.guild.channels.cache.get(settings.logChannelId);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📝 訊息編輯')
            .addFields(
                { name: '原始訊息', value: oldMessage.content || '無內容', inline: true },
                { name: '新訊息', value: newMessage.content || '無內容', inline: true },
                { name: '編輯者', value: `${newMessage.author.tag}`, inline: true }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    },
};

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        if (!settings.logEvents.includes('messageDelete')) return;

        const logChannel = message.guild.channels.cache.get(settings.logChannelId);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🗑️ 訊息刪除')
            .addFields(
                { name: '訊息內容', value: message.content || '無內容', inline: true },
                { name: '發送者', value: `${message.author.tag}`, inline: true }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    },
};

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (!settings.logEvents.includes('messageImage')) return;

        const logChannel = message.guild.channels.cache.get(settings.logChannelId);
        if (!logChannel) return;

        if (message.attachments.size > 0) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📸 圖片發送')
                .addFields(
                    { name: '發送者', value: `${message.author.tag}`, inline: true }
                )
                .setImage(message.attachments.first().url)
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    },
};
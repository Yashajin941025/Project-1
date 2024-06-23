const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const settings = require('../../set/settings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('靜言用戶')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('要靜言的用戶')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('靜言的時間（秒）')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('靜言的理由')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
    async execute(interaction) {
        const userToMute = interaction.options.getMember('user');
        const totalSeconds = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || '違反規定';

        // 確保命令由管理員執行
        if (!interaction.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return interaction.reply({ content: '你沒有靜言用戶的權限。', ephemeral: true });
        }

        if (!userToMute) {
            return interaction.reply({ content: '請提及一個用戶。', ephemeral: true });
        }

        if (isNaN(totalSeconds) || totalSeconds <= 0) {
            return interaction.reply({ content: '無效的時間格式。請輸入有效的秒數。', ephemeral: true });
        }

        try {
            // 靜言用戶
            await userToMute.timeout(totalSeconds * 1000, reason);

            // 計算時間格式
            const days = Math.floor(totalSeconds / (24 * 3600));
            const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            const unmuteTime = new Date(Date.now() + totalSeconds * 1000);

            // 創建一個內嵌消息
            const muteEmbed = new EmbedBuilder()
                .setColor('#ff9900')
                .setTitle('🔇 靜言通知 🔇')
                .setThumbnail(userToMute.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`已成功靜言 ${userToMute.user.tag}`)
                .addFields(
                    { name: '靜言用戶', value: `${userToMute.user.tag} | ${userToMute.user.id}`, inline: true },
                    { name: '靜言原因', value: reason, inline: true },
                    { name: '靜言時間', value: new Date().toLocaleString(), inline: true },
                    { name: '解除靜言時間', value: unmuteTime.toLocaleString(), inline: true },
                    { name: '靜言時長', value: `${days}天${hours}時${minutes}分${seconds}秒`, inline: true },
                    { name: '管理員', value: `${interaction.user}`, inline: true }
                )
                .setFooter({ text: '請遵守社區規範，避免再次靜言。' })
                .setTimestamp();

            // 發送到指定的日誌頻道
            const logChannel = interaction.guild.channels.cache.find(channel => channel.name === settings.logChannelName);
            if (logChannel) {
                logChannel.send({ embeds: [muteEmbed] });
            }

            // 回應靜言訊息
            await interaction.reply({ content: `已成功靜言 ${userToMute.user.tag} 並將於 ${unmuteTime.toLocaleString()} 後解除`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '發生錯誤，無法靜言該用戶。', ephemeral: true });
        }
    },
};
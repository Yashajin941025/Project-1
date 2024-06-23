const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const settings = require('../../set/settings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('封禁用戶並刪除聊天記錄')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('要封禁的用戶')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('封禁的理由')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const userToBan = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || '違反規定';

        // 確保命令由管理員執行
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '你沒有封禁用戶的權限。', ephemeral: true });
        }

        if (!userToBan) {
            return interaction.reply({ content: '請提及一個用戶。', ephemeral: true });
        }

        try {
            // 封禁用戶並刪除過去7天內的聊天記錄
            await interaction.guild.members.ban(userToBan, { days: 7, reason: reason });

            // 創建一個內嵌消息
            const banEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🚫 封禁通知 🚫')
                .setThumbnail(userToBan.displayAvatarURL({ dynamic: true }))
                .setDescription(`已成功封禁 ${userToBan.tag}`)
                .addFields(
                    { name: '封禁用戶', value: `${userToBan.tag} | ${userToBan.id}`, inline: true },
                    { name: '封禁原因', value: reason, inline: true },
                    { name: '封禁日期', value: new Date().toLocaleString(), inline: true },
                    { name: '操作者', value: `${interaction.user}`, inline: true }
                )
                .setFooter({ text: '已封禁該用戶，以多加維持社群風範。' })
                .setTimestamp();

            // 發送到指定的日誌頻道
            const logChannel = interaction.guild.channels.cache.find(channel => channel.name === settings.logChannelName);
            if (logChannel) {
                logChannel.send({ embeds: [banEmbed] });
            }

            // 回應封禁訊息
            await interaction.reply({ content: `${userToBan.tag} 已被封禁。理由: ${reason}`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '發生錯誤，無法封禁該用戶。', ephemeral: true });
        }
    },
};
const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const settings = require('../../set/settings');

// 讀取警告數據
async function readWarnings() {
    try {
        const data = await fs.readFile(settings.warnFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // 如果文件不存在或者無法解析，返回一個空陣列
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            return [];
        } else {
            console.error('讀取警告文件時出錯:', error);
            return []; // 確保函數返回一個陣列
        }
    }
}

// 寫入警告數據
async function writeWarnings(warnings) {
    try {
        await fs.writeFile(settings.warnFilePath, JSON.stringify(warnings, null, 4), 'utf8');
    } catch (error) {
        console.error('寫入警告文件時出錯:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delwarn')
        .setDescription('刪除用戶的警告')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('要刪除警告的用戶')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('要刪除的警告次數')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const userToDelWarn = interaction.options.getMember('user');
        const count = interaction.options.getInteger('count');

        if (!userToDelWarn) {
            return interaction.reply({ content: '請提及一個用戶。', ephemeral: true });
        }

        // 獲取當前所有警告
        const currentWarnings = await readWarnings();

        // 計算該用戶的警告次數
        const userWarnings = currentWarnings.filter(warning => warning.userId === userToDelWarn.id);

        if (userWarnings.length < count) {
            return interaction.reply({ content: `該用戶目前沒有這麼多警告。`, ephemeral: true });
        }

        // 刪除指定數量的警告
        const remainingWarnings = currentWarnings.filter(warning => warning.userId !== userToDelWarn.id)
            .concat(userWarnings.slice(count));

        // 寫入更新後的警告到文件
        await writeWarnings(remainingWarnings);

        // 創建內嵌訊息顯示刪除警告的詳細資訊
        const delWarnEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🗑️ 刪除警告通知 🗑️')
            .setDescription(`已刪除用戶 ${userToDelWarn} 的 ${count} 次警告。`)
            .addFields(
                { name: '用戶', value: `${userToDelWarn}`, inline: true },
                { name: '目前剩餘警告次數', value: `${userWarnings.length - count}`, inline: true }
            )
            .setTimestamp();

        // 回應內嵌訊息
        await interaction.reply({ embeds: [delWarnEmbed], ephemeral: false });
    },
};
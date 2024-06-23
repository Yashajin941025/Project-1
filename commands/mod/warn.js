const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const settings = require('../../set/settings');
const { logWarning } = require('../../logger');

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
        .setName('warn')
        .setDescription('警告用戶')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('要警告的用戶')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('警告的理由')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const userToWarn = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || '違反規定';
        const operatorTag = interaction.user.tag; // 操作人的標籤
        const operatorDisplayName = interaction.member.displayName; // 操作人在伺服器的名稱

        if (!userToWarn) {
            return interaction.reply({ content: '請提及一個用戶。', ephemeral: true });
        }

        // 檢查是否試圖警告比自己角色高的用戶
        if (interaction.member.roles.highest.position <= userToWarn.roles.highest.position) {
            return interaction.reply({ content: '你不能警告比你角色等級更高或相等的用戶。', ephemeral: true });
        }

        // 獲取當前所有警告
        const currentWarnings = await readWarnings();

        // 創建新的警告對象
        const newWarning = {
            id: currentWarnings.length + 1,
            username: userToWarn.user.username,
            userId: userToWarn.id,
            time: new Date().toISOString(),
            operator: operatorTag,
            operatorDisplayName: operatorDisplayName, // 新增操作人在伺服器的名稱
            reason: reason
        };

        // 添加新的警告到數據中
        currentWarnings.push(newWarning);

        // 寫入更新後的警告到文件
        await writeWarnings(currentWarnings);

        // 計算該用戶的警告次數
        const userWarnings = currentWarnings.filter(warning => warning.userId === userToWarn.id).length;

        // 檢查是否需要禁言或封禁
        if (settings.muteDurations[userWarnings]) {
            try {
                const muteDuration = settings.muteDurations[userWarnings];
                await userToWarn.timeout(muteDuration, `超過警告次數限制 ${userWarnings} 次`);
                const muteEmbed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle('⚠️ 禁言通知 ⚠️')
                    .setDescription(`用戶 ${userToWarn} 已被禁言 ${muteDuration / (60 * 60 * 1000)} 小時，原因：超過警告次數限制 ${userWarnings} 次。`)
                    .setTimestamp();
                await interaction.reply({ embeds: [muteEmbed], ephemeral: false });
            } catch (error) {
                console.error('禁言用戶時出錯:', error);
                await interaction.reply({ content: '禁言用戶時出錯，請檢查機器人的權限。', ephemeral: true });
            }
        } else if (userWarnings >= settings.banAfterWarnings) {
            try {
                await userToWarn.ban({ reason: `超過警告次數限制 ${settings.banAfterWarnings} 次` });
                const banEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('⚠️ 封禁通知 ⚠️')
                    .setDescription(`用戶 ${userToWarn} 已被封禁，原因：超過警告次數限制 ${settings.banAfterWarnings} 次。`)
                    .setTimestamp();
                await interaction.reply({ embeds: [banEmbed], ephemeral: false });
            } catch (error) {
                console.error('封禁用戶時出錯:', error);
                await interaction.reply({ content: '封禁用戶時出錯，請檢查機器人的權限。', ephemeral: true });
            }
        } else {
            // 創建內嵌訊息顯示警告的詳細資訊
            const warnEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('⚠️ 警告通知 ⚠️')
                .setDescription(`用戶 ${userToWarn} 已被警告。`)
                .addFields(
                    { name: '用戶', value: `${userToWarn}`, inline: true },
                    { name: '違規原因', value: reason, inline: true },
                    { name: '警告時間', value: new Date().toLocaleString(), inline: true },
                    { name: '累計次數', value: `${userWarnings}`, inline: true }
                )
                .setFooter({ text: '請務必注意言行，避免收到處置' })
                .setTimestamp();

            // 回應內嵌訊息
            await interaction.reply({ embeds: [warnEmbed], ephemeral: false });
        }

        // 記錄警告到日誌頻道
        try {
            await logWarning(interaction.client, newWarning);
        } catch (error) {
            console.error('記錄警告到日誌頻道時出錯:', error);
        }
    },
};
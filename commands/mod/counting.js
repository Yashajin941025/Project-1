const { Events } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const settings = require('../../set/settings');

// 寫入設置數據
async function writeSettings(newSettings) {
    const settingsPath = path.resolve(__dirname, '../../set/settings.js');
    const settingsContent = `module.exports = ${JSON.stringify(newSettings, null, 4)};`;
    await fs.writeFile(settingsPath, settingsContent, 'utf8');
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // 確保計數頻道已設置
        if (!settings.countingChannelId) {
            return;
        }

        // 只在指定頻道中監聽訊息
        if (message.channel.id === settings.countingChannelId) {
            // 檢查訊息是否為數字
            if (!isNaN(message.content)) {
                // 嘗試將訊息內容轉換為數字
                const messageNumber = parseInt(message.content);

                // 讀取當前數字和最後發言的用戶ID
                const currentNumber = settings.currentNumber;
                const lastUserId = settings.lastUserId;

                // 檢查訊息是否為下一個預期的數字，並且發言者不是最後一個發言的用戶
                if (messageNumber === currentNumber + 1 && message.author.id !== lastUserId) {
                    // 給出正確的數字反應
                    message.react('✅').catch(console.error);
                    // 更新當前數字和最後發言的用戶ID
                    settings.currentNumber = messageNumber;
                    settings.lastUserId = message.author.id;
                    await writeSettings(settings);
                } else {
                    // 如果數字不正確或用戶連續發言，刪除訊息
                    message.delete().catch(console.error);
                }
            } else {
                // 如果訊息不是數字，直接刪除訊息
                message.delete().catch(console.error);
            }
        }
    },
};
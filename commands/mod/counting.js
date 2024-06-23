const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const settings = require('../../set/settings');

// 讀取當前數字
function readCurrentNumber() {
    const data = fs.readFileSync(path.resolve(__dirname, '../../currentNumber.json'), 'utf8');
    return JSON.parse(data).number;
}

// 更新當前數字
function updateCurrentNumber(newNumber) {
    fs.writeFileSync(path.resolve(__dirname, '../../currentNumber.json'), JSON.stringify({ number: newNumber }), 'utf8');
}

// 讀取最後發言的用戶ID
function readLastUserId() {
    const data = fs.readFileSync(path.resolve(__dirname, '../../lastUser.json'), 'utf8');
    return JSON.parse(data).userId;
}

// 更新最後發言的用戶ID
function updateLastUserId(userId) {
    fs.writeFileSync(path.resolve(__dirname, '../../lastUser.json'), JSON.stringify({ userId: userId }), 'utf8');
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
                const currentNumber = readCurrentNumber();
                const lastUserId = readLastUserId();

                // 檢查訊息是否為下一個預期的數字，並且發言者不是最後一個發言的用戶
                if (messageNumber === currentNumber + 1 && message.author.id !== lastUserId) {
                    // 給出正確的數字反應
                    message.react('✅').catch(console.error);
                    // 更新當前數字和最後發言的用戶ID
                    updateCurrentNumber(messageNumber);
                    updateLastUserId(message.author.id);
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
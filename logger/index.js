const { EmbedBuilder } = require('discord.js');
const settings = require('../set/settings');

async function logWarning(client, warning) {
  const logChannel = client.channels.cache.find(channel => channel.name === settings.logChannelName);
  if (!logChannel) {
    console.error(`找不到名為 ${settings.logChannelName} 的頻道`);
    return;
  }

  const warnEmbed = new EmbedBuilder()
    .setTitle('警告通知')
    .setDescription(`${warning.username} 已被警告`)
    .addFields(
      { name: '用戶名', value: warning.username, inline: true },
      { name: '警告理由', value: warning.reason, inline: true },
      { name: '警告ID', value: warning.id.toString(), inline: true },
      { name: '操作人', value: `${warning.operatorDisplayName} (${warning.operator})`, inline: true }
    )
    .setColor('#ff9900')
    .setTimestamp();

  try {
    await logChannel.send({ embeds: [warnEmbed] });
    console.log(`成功發送警告訊息到頻道 ${settings.logChannelName}`);
  } catch (error) {
    console.error(`無法發送訊息到頻道 ${settings.logChannelName}:`, error);
  }
}

module.exports = {
  logWarning,
};
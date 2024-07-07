const { getJson } = require("@helpers/HttpUtils");
const { success, warn, error } = require("@helpers/Logger");

module.exports = class BotUtils {
  /**
   * Check if the bot is up to date
   */
  static async checkForUpdates() {
    const response = await getJson("https://api.github.com/repos/Yashajin941025/Project-1/releases/latest");
    if (!response.success) return error("最新版本檢查 : 無法檢查機器人更新");
    if (response.data) {
      if (
        require("@root/package.json").version.replace(/[^0-9]/g, "") >= response.data.tag_name.replace(/[^0-9]/g, "")
      ) {
        success("最新版本檢查：已經是最新的啦!");
      } else {
        warn(`最新版本檢查: ${response.data.tag_name} 更新可用`);
        warn("download: https://github.com/Yashajin941025/Project-1/releases/latest");
      }
    }
  }

  /**
   * Get the image url from the message
   * @param {import('discord.js').Message} message
   * @param {string[]} args
   */
  static async getImageFromMessage(message, args) {
    let url;

    // check for attachments
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      const attachUrl = attachment.url;
      const attachIsImage = attachUrl.endsWith(".png") || attachUrl.endsWith(".jpg") || attachUrl.endsWith(".jpeg");
      if (attachIsImage) url = attachUrl;
    }

    if (!url && args.length === 0) url = message.author.displayAvatarURL({ size: 256, extension: "png" });

    if (!url && args.length !== 0) {
      try {
        url = new URL(args[0]).href;
      } catch (ex) {
        /* Ignore */
      }
    }

    if (!url && message.mentions.users.size > 0) {
      url = message.mentions.users.first().displayAvatarURL({ size: 256, extension: "png" });
    }

    if (!url) {
      const member = await message.guild.resolveMember(args[0]);
      if (member) url = member.user.displayAvatarURL({ size: 256, extension: "png" });
    }

    if (!url) url = message.author.displayAvatarURL({ size: 256, extension: "png" });

    return url;
  }

  static get musicValidations() {
    return [
      {
        callback: ({ client, guildId }) => client.musicManager.getPlayer(guildId),
        message: "🚫 沒有播放音樂!",
      },
      {
        callback: ({ member }) => member.voice?.channelId,
        message: "🚫 你需要加入我的語音頻道.",
      },
      {
        callback: ({ member, client, guildId }) =>
          member.voice?.channelId === client.musicManager.getPlayer(guildId)?.channelId,
        message: "🚫 你們不在同一個語音頻道。",
      },
    ];
  }
};

const { EmbedBuilder, ApplicationCommandOptionType, ChannelType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { stripIndent } = require("common-tags");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "automod",
  description: "various automod configuration",
  category: "AUTOMOD",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "status",
        description: "檢查該伺服器的 automod 配置",
      },
      {
        trigger: "strikes <number>",
        description: "會員在採取行動之前可以收到的最大罷工次數",
      },
      {
        trigger: "action <TIMEOUT|KICK|BAN>",
        description: "設定收到最大打擊後要執行的操作",
      },
      {
        trigger: "debug <on|off>",
        description: "為管理員和版主發送的訊息打開 automod",
      },
      {
        trigger: "whitelist",
        description: "列入白名單的頻道列表",
      },
      {
        trigger: "whitelistadd <channel>",
        description: "將頻道加入白名單",
      },
      {
        trigger: "whitelistremove <channel>",
        description: "將頻道從白名單中刪除",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "檢查 automod 配置",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "strikes",
        description: "在執行操作之前設置最大警示次數",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "警示次數（預設 5 次）",
            required: true,
            type: ApplicationCommandOptionType.Integer,
          },
        ],
      },
      {
        name: "action",
        description: "設置在收到最大警示后執行的操作",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "action",
            description: "要執行的操作",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              {
                name: "TIMEOUT",
                value: "TIMEOUT",
              },
              {
                name: "KICK",
                value: "KICK",
              },
              {
                name: "BAN",
                value: "BAN",
              },
            ],
          },
        ],
      },
      {
        name: "debug",
        description: "enable/disable 管理員和版主發送的消息的 AutoMod",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "configuration status",
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: "ON",
                value: "ON",
              },
              {
                name: "OFF",
                value: "OFF",
              },
            ],
          },
        ],
      },
      {
        name: "whitelist",
        description: "查看列入白名單的頻道",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "whitelistadd",
        description: "將頻道添加到白名單中",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "要添加的頻道",
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
          },
        ],
      },
      {
        name: "whitelistremove",
        description: "從白名單中移除頻道",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "要刪除的頻道",
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const input = args[0].toLowerCase();
    const settings = data.settings;

    let response;
    if (input === "status") {
      response = await getStatus(settings, message.guild);
    } else if (input === "strikes") {
      const strikes = args[1];
      if (isNaN(strikes) || Number.parseInt(strikes) < 1) {
        return message.safeReply("警示值必須是大於 0 的有效數位");
      }
      response = await setStrikes(settings, strikes);
    } else if (input === "action") {
      const action = args[1].toUpperCase();
      if (!action || !["TIMEOUT", "KICK", "BAN"].includes(action))
        return message.safeReply("無效操作。操作可以是 `Timeout`/`Kick`/`Ban`");
      response = await setAction(settings, message.guild, action);
    } else if (input === "debug") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.safeReply("無效狀態。值必須為 `on/off`");
      response = await setDebug(settings, status);
    }

    // whitelist
    else if (input === "whitelist") {
      response = getWhitelist(message.guild, settings);
    }

    // whitelist add
    else if (input === "whitelistadd") {
      const match = message.guild.findMatchingChannels(args[1]);
      if (!match.length) return message.safeReply(`未找到匹配的頻道 ${args[1]}`);
      response = await whiteListAdd(settings, match[0].id);
    }

    // whitelist remove
    else if (input === "whitelistremove") {
      const match = message.guild.findMatchingChannels(args[1]);
      if (!match.length) return message.safeReply(`未找到匹配的頻道 ${args[1]}`);
      response = await whiteListRemove(settings, match[0].id);
    }

    //
    else response = "無效的命令用法!";
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;

    if (sub === "status") response = await getStatus(settings, interaction.guild);
    else if (sub === "strikes") response = await setStrikes(settings, interaction.options.getInteger("amount"));
    else if (sub === "action")
      response = await setAction(settings, interaction.guild, interaction.options.getString("action"));
    else if (sub === "debug") response = await setDebug(settings, interaction.options.getString("status"));
    else if (sub === "whitelist") {
      response = getWhitelist(interaction.guild, settings);
    } else if (sub === "whitelistadd") {
      const channelId = interaction.options.getChannel("channel").id;
      response = await whiteListAdd(settings, channelId);
    } else if (sub === "whitelistremove") {
      const channelId = interaction.options.getChannel("channel").id;
      response = await whiteListRemove(settings, channelId);
    }

    await interaction.followUp(response);
  },
};

async function getStatus(settings, guild) {
  const { automod } = settings;

  const logChannel = settings.modlog_channel
    ? guild.channels.cache.get(settings.modlog_channel).toString()
    : "Not Configured";

  // String Builder
  let desc = stripIndent`
    ❯ **最大線數**: ${automod.max_lines || "NA"}
    ❯ **反大規模**: ${automod.anti_massmention > 0 ? "✓" : "✕"}
    ❯ **防附件**: ${automod.anti_attachment ? "✓" : "✕"}
    ❯ **防鏈接**: ${automod.anti_links ? "✓" : "✕"}
    ❯ **防邀請**: ${automod.anti_invites ? "✓" : "✕"}
    ❯ **防垃圾郵件**: ${automod.anti_spam ? "✓" : "✕"}
    ❯ **Anti-Ghostping**: ${automod.anti_ghostping ? "✓" : "✕"}
  `;

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Automod Configuration", iconURL: guild.iconURL() })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(desc)
    .addFields(
      {
        name: "Log Channel",
        value: logChannel,
        inline: true,
      },
      {
        name: "Max Strikes",
        value: automod.strikes.toString(),
        inline: true,
      },
      {
        name: "Action",
        value: automod.action,
        inline: true,
      },
      {
        name: "Debug",
        value: automod.debug ? "✓" : "✕",
        inline: true,
      }
    );

  return { embeds: [embed] };
}

async function setStrikes(settings, strikes) {
  settings.automod.strikes = strikes;
  await settings.save();
  return `配置已保存！最大警示值設置為 ${strikes}`;
}

async function setAction(settings, guild, action) {
  if (action === "TIMEOUT") {
    if (!guild.members.me.permissions.has("ModerateMembers")) {
      return "我沒有權限禁言成員";
    }
  }

  if (action === "KICK") {
    if (!guild.members.me.permissions.has("KickMembers")) {
      return "我沒有權限踢成員";
    }
  }

  if (action === "BAN") {
    if (!guild.members.me.permissions.has("BanMembers")) {
      return "我沒有權限封禁成員";
    }
  }

  settings.automod.action = action;
  await settings.save();
  return `配置已保存！Automod 操作設置為 ${action}`;
}

async function setDebug(settings, input) {
  const status = input.toLowerCase() === "on" ? true : false;
  settings.automod.debug = status;
  await settings.save();
  return `配置已保存！Automod 調試現已完成 ${status ? "enabled" : "disabled"}`;
}

function getWhitelist(guild, settings) {
  const whitelist = settings.automod.wh_channels;
  if (!whitelist || !whitelist.length) return "沒有頻道被列入白名單";

  const channels = [];
  for (const channelId of whitelist) {
    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;
    if (channel) channels.push(channel.toString());
  }

  return `列入白名單的頻道: ${channels.join(", ")}`;
}

async function whiteListAdd(settings, channelId) {
  if (settings.automod.wh_channels.includes(channelId)) return "頻道已被列入白名單";
  settings.automod.wh_channels.push(channelId);
  await settings.save();
  return `頻道已列入白名單!`;
}

async function whiteListRemove(settings, channelId) {
  if (!settings.automod.wh_channels.includes(channelId)) return "頻道未被列入白名單";
  settings.automod.wh_channels.splice(settings.automod.wh_channels.indexOf(channelId), 1);
  await settings.save();
  return `頻道已從白名單中移除!`;
}

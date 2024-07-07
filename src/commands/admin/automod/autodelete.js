const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "autodelete",
  description: "manage the autodelete settings for the server",
  category: "AUTOMOD",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 2,
    subcommands: [
      {
        trigger: "attachments <on|off>",
        description: "允許或禁止郵件中的附件",
      },
      {
        trigger: "invites <on|off>",
        description: "允許或禁止訊息中的邀請",
      },
      {
        trigger: "links <on|off>",
        description: "允許或禁止訊息中的鏈接",
      },
      {
        trigger: "maxlines <number>",
        description: "設定每條訊息允許的最大行數 [0 表示停用]",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "attachments",
        description: "允許或禁止郵件中的附件",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "配置狀態",
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
        name: "invites",
        description: "允許或禁止訊息中的不和諧邀請",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "配置狀態",
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
        name: "links",
        description: "允許或禁止訊息中的鏈接",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "配置狀態",
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
        name: "maxlines",
        description: "設定每條訊息允許的最大行數",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "amount",
            description: "配置數量（0表示停用）",
            required: true,
            type: ApplicationCommandOptionType.Integer,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const settings = data.settings;
    const sub = args[0].toLowerCase();
    let response;

    if (sub == "attachments") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.safeReply("無效狀態。值必須是 `on/off`");
      response = await antiAttachments(settings, status);
    }

    //
    else if (sub === "invites") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.safeReply("無效狀態。值必須是 `on/off`");
      response = await antiInvites(settings, status);
    }

    //
    else if (sub == "links") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.safeReply("無效狀態。值必須是 `on/off`");
      response = await antilinks(settings, status);
    }

    //
    else if (sub === "maxlines") {
      const max = args[1];
      if (isNaN(max) || Number.parseInt(max) < 1) {
        return message.safeReply("最大行數必須是大於 0 的有效數字");
      }
      response = await maxLines(settings, max);
    }

    //
    else response = "命令使用無效!";
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;
    let response;

    if (sub == "attachments") {
      response = await antiAttachments(settings, interaction.options.getString("status"));
    } else if (sub === "invites") response = await antiInvites(settings, interaction.options.getString("status"));
    else if (sub == "links") response = await antilinks(settings, interaction.options.getString("status"));
    else if (sub === "maxlines") response = await maxLines(settings, interaction.options.getInteger("amount"));
    else response = "Invalid command usage!";

    await interaction.followUp(response);
  },
};

async function antiAttachments(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_attachments = status;
  await settings.save();
  return `Messages ${
    status ? "帶有附件的現在將會自動刪除" : "現在不會過濾附件"
  }`;
}

async function antiInvites(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_invites = status;
  await settings.save();
  return `Messages ${
    status ? "不和諧的邀請現在將自動刪除" : "現在不會過濾不和諧邀請"
  }`;
}

async function antilinks(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_links = status;
  await settings.save();
  return `Messages ${status ? "帶有連結的連結現在將自動刪除" : "現在不會過濾連結"}`;
}

async function maxLines(settings, input) {
  const lines = Number.parseInt(input);
  if (isNaN(lines)) return "請輸入有效的數字";

  settings.automod.max_lines = lines;
  await settings.save();
  return `${
    input === 0
      ? "最大行數限制已停用"
      : `訊息長度超過 \`${input}\` 現在將自動刪除`
  }`;
}

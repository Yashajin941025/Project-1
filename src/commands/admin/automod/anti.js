const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "anti",
  description: "管理伺服器的各種自動模式設定",
  category: "AUTOMOD",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 2,
    subcommands: [
      {
        trigger: "ghostping <on|off>",
        description: "偵測並記錄伺服器中的幽靈提及",
      },
      {
        trigger: "spam <on|off>",
        description: "啟用或停用反垃圾郵件偵測",
      },
      {
        trigger: "massmention <on|off> [threshold]",
        description: "啟用或停用大規模提及偵測[預設閾值為 3 次提及]",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "ghostping",
        description: "偵測並記錄伺服器中的幽靈提及",
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
        name: "spam",
        description: "啟用或停用反垃圾郵件偵測",
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
        name: "massmention",
        description: "啟用或停用大規模偵測",
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
          {
            name: "threshold",
            description: "配置閾值（預設為 3 次提及）",
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
    if (sub == "ghostping") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.safeReply("無效狀態。數值必須為“開/關”");
      response = await antiGhostPing(settings, status);
    }

    //
    else if (sub == "spam") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.safeReply("無效狀態。數值必須為“開/關”");
      response = await antiSpam(settings, status);
    }

    //
    else if (sub === "massmention") {
      const status = args[1].toLowerCase();
      const threshold = args[2] || 3;
      if (!["on", "off"].includes(status)) return message.safeReply("無效狀態。數值必須為“開/關”");
      response = await antiMassMention(settings, status, threshold);
    }

    //
    else response = "命令使用無效!";
    await message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;
    if (sub == "ghostping") response = await antiGhostPing(settings, interaction.options.getString("status"));
    else if (sub == "spam") response = await antiSpam(settings, interaction.options.getString("status"));
    else if (sub === "massmention") {
      response = await antiMassMention(
        settings,
        interaction.options.getString("status"),
        interaction.options.getInteger("threshold")
      );
    } else response = "命令使用無效!";

    await interaction.followUp(response);
  },
};

async function antiGhostPing(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_ghostping = status;
  await settings.save();
  return `配置已儲存！防重影現在為 ${status ? "enabled" : "disabled"}`;
}

async function antiSpam(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_spam = status;
  await settings.save();
  return `反垃圾郵件檢測狀態為${status ? "enabled" : "disabled"}`;
}

async function antiMassMention(settings, input, threshold) {
  const status = input.toUpperCase() === "ON" ? true : false;
  if (!status) {
    settings.automod.anti_massmention = 0;
  } else {
    settings.automod.anti_massmention = threshold;
  }
  await settings.save();
  return `現在進行大量提及檢測 ${status ? "enabled" : "disabled"}`;
}

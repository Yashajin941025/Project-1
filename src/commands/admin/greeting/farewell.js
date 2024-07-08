const { isHex } = require("@helpers/Utils");
const { buildGreeting } = require("@handlers/greeting");
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "farewell",
  description: "setup farewell message",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "狀態<on|off>",
        description: "啟用 或 停用 退出訊息",
      },
      {
        trigger: "頻道 <#channel>",
        description: "設定退出訊息",
      },
      {
        trigger: "預覽",
        description: "預覽配置的退出訊息",
      },
      {
        trigger: "描述 <text>",
        description: "設定嵌入描述",
      },
      {
        trigger: "縮圖 <ON|OFF>",
        description: "enable/disable 嵌入縮圖",
      },
      {
        trigger: "color <hexcolor>",
        description: "嵌入 color",
      },
      {
        trigger: "嵌入頁腳 <text>",
        description: "設定嵌入頁腳內容",
      },
      {
        trigger: "image <url>",
        description: "設定嵌入圖像",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "status",
        description: "啟用或停用退出訊息",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "enabled or disabled",
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
        name: "preview",
        description: "預覽配置的退出訊息",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "channel",
        description: "設定退出頻道",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "頻道",
            description: "頻道名稱",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
          },
        ],
      },
      {
        name: "desc",
        description: "設定嵌入描述",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "content",
            description: "描述內容",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "thumbnail",
        description: "配置嵌入縮圖",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "status",
            description: "縮圖狀態",
            type: ApplicationCommandOptionType.String,
            required: true,
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
        name: "color",
        description: "set embed color",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "hex-code",
            description: "hex color code",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "footer",
        description: "set embed footer",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "content",
            description: "footer content",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "image",
        description: "set embed image",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "url",
            description: "image url",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args, data) {
    const type = args[0].toLowerCase();
    const settings = data.settings;
    let response;

    // preview
    if (type === "preview") {
      response = await sendPreview(settings, message.member);
    }

    // status
    else if (type === "status") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status))
        return message.safeReply("Invalid status. Value must be `on/off`");
      response = await setStatus(settings, status);
    }

    // channel
    else if (type === "channel") {
      const channel = message.mentions.channels.first();
      response = await setChannel(settings, channel);
    }

    // desc
    else if (type === "desc") {
      if (args.length < 2) return message.safeReply("Insufficient arguments! Please provide valid content");
      const desc = args.slice(1).join(" ");
      response = await setDescription(settings, desc);
    }

    // thumbnail
    else if (type === "thumbnail") {
      const status = args[1]?.toUpperCase();
      if (!status || !["ON", "OFF"].includes(status))
        return message.safeReply("Invalid status. Value must be `on/off`");
      response = await setThumbnail(settings, status);
    }

    // color
    else if (type === "color") {
      const color = args[1];
      if (!color || !isHex(color)) return message.safeReply("Invalid color. Value must be a valid hex color");
      response = await setColor(settings, color);
    }

    // footer
    else if (type === "footer") {
      if (args.length < 2) return message.safeReply("Insufficient arguments! Please provide valid content");
      const content = args.slice(1).join(" ");
      response = await setFooter(settings, content);
    }

    // image
    else if (type === "image") {
      const url = args[1];
      if (!url) return message.safeReply("Invalid image url. Please provide a valid url");
      response = await setImage(settings, url);
    }

    //
    else response = "Invalid command usage!";
    return message.safeReply(response);
  },

  async interactionRun(interaction, data) {
    const sub = interaction.options.getSubcommand();
    const settings = data.settings;

    let response;
    switch (sub) {
      case "preview":
        response = await sendPreview(settings, interaction.member);
        break;

      case "status":
        response = await setStatus(settings, interaction.options.getString("status"));
        break;

      case "channel":
        response = await setChannel(settings, interaction.options.getChannel("channel"));
        break;

      case "desc":
        response = await setDescription(settings, interaction.options.getString("content"));
        break;

      case "thumbnail":
        response = await setThumbnail(settings, interaction.options.getString("status"));
        break;

      case "color":
        response = await setColor(settings, interaction.options.getString("hex-code"));
        break;

      case "footer":
        response = await setFooter(settings, interaction.options.getString("content"));
        break;

      case "image":
        response = await setImage(settings, interaction.options.getString("url"));
        break;

      default:
        response = "Invalid subcommand";
    }

    return interaction.followUp(response);
  },
};

async function sendPreview(settings, member) {
  if (!settings.farewell?.enabled) return "Farewell message not enabled in this server";

  const targetChannel = member.guild.channels.cache.get(settings.farewell.channel);
  if (!targetChannel) return "No channel is configured to send farewell message";

  const response = await buildGreeting(member, "FAREWELL", settings.farewell);
  await targetChannel.safeSend(response);

  return `Sent farewell preview to ${targetChannel.toString()}`;
}

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.farewell.enabled = enabled;
  await settings.save();
  return `Configuration saved! Farewell message ${status ? "enabled" : "disabled"}`;
}

async function setChannel(settings, channel) {
  if (!channel.canSendEmbeds()) {
    return (
      "Ugh! I cannot send greeting to that channel? I need the `Write Messages` and `Embed Links` permissions in " +
      channel.toString()
    );
  }
  settings.farewell.channel = channel.id;
  await settings.save();
  return `Configuration saved! Farewell message will be sent to ${channel ? channel.toString() : "Not found"}`;
}

async function setDescription(settings, desc) {
  settings.farewell.embed.description = desc;
  await settings.save();
  return "Configuration saved! Farewell message updated";
}

async function setThumbnail(settings, status) {
  settings.farewell.embed.thumbnail = status.toUpperCase() === "ON" ? true : false;
  await settings.save();
  return "Configuration saved! Farewell message updated";
}

async function setColor(settings, color) {
  settings.farewell.embed.color = color;
  await settings.save();
  return "Configuration saved! Farewell message updated";
}

async function setFooter(settings, content) {
  settings.farewell.embed.footer = content;
  await settings.save();
  return "Configuration saved! Farewell message updated";
}

async function setImage(settings, url) {
  settings.farewell.embed.image = url;
  await settings.save();
  return "Configuration saved! Farewell message updated";
}

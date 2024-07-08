const { ApplicationCommandOptionType } = require("discord.js");
const balance = require("./sub/balance");
const deposit = require("./sub/deposit");
const transfer = require("./sub/transfer");
const withdraw = require("./sub/withdraw");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "bank",
  description: "進入銀行業務",
  category: "ECONOMY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    minArgsCount: 1,
    subcommands: [
      {
        trigger: "balance",
        description: "檢查您的餘額",
      },
      {
        trigger: "deposit <coins>",
        description: "將硬幣存入您的銀行帳戶",
      },
      {
        trigger: "withdraw <coins>",
        description: "從您的銀行帳戶中提取硬幣",
      },
      {
        trigger: "transfer <user> <coins>",
        description: "將硬幣轉移給另一個用戶",
      },
    ],
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "balance",
        description: "check your coin balance",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "name of the user",
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: "deposit",
        description: "deposit coins to your bank account",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "coins",
            description: "number of coins to deposit",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "withdraw",
        description: "withdraw coins from your bank account",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "coins",
            description: "number of coins to withdraw",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
      {
        name: "transfer",
        description: "transfer coins to other user",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "user",
            description: "the user to whom coins must be transferred",
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: "coins",
            description: "the amount of coins to transfer",
            type: ApplicationCommandOptionType.Integer,
            required: true,
          },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const sub = args[0];
    let response;

    if (sub === "balance") {
      const resolved = (await message.guild.resolveMember(args[1])) || message.member;
      response = await balance(resolved.user);
    }

    //
    else if (sub === "deposit") {
      const coins = args.length && parseInt(args[1]);
      if (isNaN(coins)) return message.safeReply("Provide a valid number of coins you wish to deposit");
      response = await deposit(message.author, coins);
    }

    //
    else if (sub === "withdraw") {
      const coins = args.length && parseInt(args[1]);
      if (isNaN(coins)) return message.safeReply("Provide a valid number of coins you wish to withdraw");
      response = await withdraw(message.author, coins);
    }

    //
    else if (sub === "transfer") {
      if (args.length < 3) return message.safeReply("Provide a valid user and coins to transfer");
      const target = await message.guild.resolveMember(args[1], true);
      if (!target) return message.safeReply("Provide a valid user to transfer coins to");
      const coins = parseInt(args[2]);
      if (isNaN(coins)) return message.safeReply("Provide a valid number of coins you wish to transfer");
      response = await transfer(message.author, target.user, coins);
    }

    //
    else {
      return message.safeReply("Invalid command usage");
    }

    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    // balance
    if (sub === "balance") {
      const user = interaction.options.getUser("user") || interaction.user;
      response = await balance(user);
    }

    // deposit
    else if (sub === "deposit") {
      const coins = interaction.options.getInteger("coins");
      response = await deposit(interaction.user, coins);
    }

    // withdraw
    else if (sub === "withdraw") {
      const coins = interaction.options.getInteger("coins");
      response = await withdraw(interaction.user, coins);
    }

    // transfer
    else if (sub === "transfer") {
      const user = interaction.options.getUser("user");
      const coins = interaction.options.getInteger("coins");
      response = await transfer(interaction.user, user, coins);
    }

    await interaction.followUp(response);
  },
};

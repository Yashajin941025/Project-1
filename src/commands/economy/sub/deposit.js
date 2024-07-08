const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { ECONOMY, EMBED_COLORS } = require("@root/config");

module.exports = async (user, coins) => {
  if (isNaN(coins) || coins <= 0) return "Please enter a valid amount of coins to deposit";
  const userDb = await getUser(user);

  if (coins > userDb.coins) return `You only have ${userDb.coins}${ECONOMY.CURRENCY} coins in your wallet`;

  userDb.coins -= coins;
  userDb.bank += coins;
  await userDb.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: "New Balance" })
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      {
        name: "錢包",
        value: `${userDb.coins}${ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: "銀行",
        value: `${userDb.bank}${ECONOMY.CURRENCY}`,
        inline: true,
      },
      {
        name: "淨值",
        value: `${userDb.coins + userDb.bank}${ECONOMY.CURRENCY}`,
        inline: true,
      }
    );

  return { embeds: [embed] };
};

const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config");

module.exports = async (user, coins) => {
  if (isNaN(coins) || coins <= 0) return "請輸入要存入的有效硬幣數量";
  const userDb = await getUser(user);

  if (coins > userDb.bank) return `你只有 ${userDb.bank}${ECONOMY.CURRENCY} 你銀行裡的硬幣`;

  userDb.bank -= coins;
  userDb.coins += coins;
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

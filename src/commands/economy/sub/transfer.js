const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { ECONOMY, EMBED_COLORS } = require("@root/config");

module.exports = async (self, target, coins) => {
  if (isNaN(coins) || coins <= 0) return "請輸入要轉帳的有效幣數";
  if (target.bot) return "您不能將硬幣轉移給機器人!";
  if (target.id === self.id) return "您不能將硬幣轉移給自己!";

  const userDb = await getUser(self);

  if (userDb.bank < coins) {
    return `銀行存款餘額不足！你只有 ${userDb.bank}${ECONOMY.CURRENCY} 在您的銀行帳戶中.${
      userDb.coins > 0 && "\n您必須先將硬幣存入銀行才能轉賬"
    } `;
  }

  const targetDb = await getUser(target);

  userDb.bank -= coins;
  targetDb.bank += coins;

  await userDb.save();
  await targetDb.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: "更新餘額" })
    .setDescription(`您已成功轉帳 ${coins}${ECONOMY.CURRENCY} 到 ${target.username}`)
    .setTimestamp(Date.now());

  return { embeds: [embed] };
};

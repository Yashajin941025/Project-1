const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const os = require('os');
const osUtils = require('os-utils');
const verjson = require('../../ver.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('顯示目前的延遲以及其他機器人資訊'),
    async execute(interaction) {
        const timeSent = Date.now();
        await interaction.reply('Pinging...');
        const timeTaken = Date.now() - timeSent;
        const uptime = process.uptime();
        const owner = 'FuLin';
        const cpuName = os.cpus()[0].model;

        const days = Math.floor(uptime / (24 * 60 * 60));
        const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((uptime % (60 * 60)) / 60);

        const companionBotId = '1213546963983667220';
        try {
            const companionMember = await interaction.guild.members.fetch(companionBotId);
            const companionStatus = companionMember.presence ? companionMember.presence.status : '無法獲取';

            osUtils.cpuUsage(async function(cpuPercent) {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('**芙蕾雅 - 狀態**')
                    .addFields(
                        { name: '延遲', value: `${timeTaken}ms`, inline: true },
                        { name: '運行時間', value: `${days}天 ${hours}時 ${minutes}分`, inline: true },
                        { name: 'CPU名稱', value: cpuName, inline: true },
                        { name: 'CPU佔用率', value: `${(cpuPercent * 100).toFixed(2)}%`, inline: true },
                        { name: '擁有者', value: owner, inline: true },
                        { name: '版本', value: `v${verjson.version}`, inline: true },
                        { name: '同伴機器人狀態', value: `${companionMember.user.tag}：${companionStatus}`, inline: true }
                    )
                    .setTimestamp();

                await interaction.editReply({ content: ' ', embeds: [embed] });
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply('無法獲取同伴機器人狀態。');
        }
    },
};
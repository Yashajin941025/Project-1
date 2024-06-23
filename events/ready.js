const deployCommands = require('../deploy-commands');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    const chalk = (await import('chalk')).default;
    console.log(chalk.blue(`Logged in as ${client.user.tag}!`));

    await deployCommands(client);

    console.log(chalk.blue('Bot is ready and commands are registered.'));
  },
};
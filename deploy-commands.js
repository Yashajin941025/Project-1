const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

module.exports = async (client) => {
  const commands = [];

  // 遞迴地讀取命令檔案
  const loadCommands = (dir = './commands') => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.lstatSync(filePath);
      if (stat.isDirectory()) {
        loadCommands(filePath);
      } else if (file.endsWith('.js')) {
        const command = require(path.resolve(filePath));
        if (command.data && command.data.toJSON) {
          commands.push(command.data.toJSON());
        } else {
          console.warn(`Skipping file ${filePath} as it does not export a valid command.`);
        }
      }
    }
  };

  loadCommands();

  const rest = new REST({ version: '9' }).setToken(config.token);

  try {
    const chalk = (await import('chalk')).default;
    console.log(chalk.yellow('Started refreshing application (/) commands.'));

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );

    console.log(chalk.green('Successfully reloaded application (/) commands.'));
    console.log('Registered commands:', commands.map(cmd => cmd.name).join(', '));
  } catch (error) {
    const chalk = (await import('chalk')).default;
    console.error(chalk.red(error));
  }
};
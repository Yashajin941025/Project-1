const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
client.commands = new Collection();

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
            if (command.data && command.data.name) {
                client.commands.set(command.data.name, command);
            } else {
                console.warn(`Skipping file ${filePath} as it does not export a valid command.`);
            }
        }
    }
};

loadCommands();

// 加載事件
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// 加載計數事件
const countingEvent = require('./commands/mod/counting');
client.on(countingEvent.name, countingEvent.execute);

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.warn(`No command found for ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        const chalk = (await import('chalk')).default;
        console.error(chalk.red(error));
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(config.token);
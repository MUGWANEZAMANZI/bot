import { readdirSync } from 'fs';
import { Collection } from 'discord.js';

export const loadCommands = (client) => {
  client.commands = new Collection();
  const commandFolders = readdirSync('./commands');

  for (const folder of commandFolders) {
    const commandFiles = readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const command = import(`../commands/${folder}/${file}`);
      client.commands.set(command.name, command);
    }
  }
};

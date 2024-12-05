import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { setupDatabase } from '../database/setup.js';
import { loadCommands } from './commandHandler.js';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await setupDatabase();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
  }
});

loadCommands(client);
client.login(process.env.TOKEN);

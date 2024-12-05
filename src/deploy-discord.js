import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
  {
    name: 'ban',
    description: 'Ban a user.',
    options: [{ name: 'user', type: 'USER', required: true }],
  },
  {
    name: 'unban',
    description: 'Unban a user.',
    options: [{ name: 'userId', type: 'STRING', required: true }],
  },
  {
    name: 'work',
    description: 'Earn random coins between 200 and 300.',
  },
  {
    name: 'give',
    description: 'Give coins to another user.',
    options: [
      { name: 'user', type: 'USER', required: true },
      { name: 'amount', type: 'INTEGER', required: true },
    ],
  },
  // Add other commands here
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Deploying commands...');
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error(error);
  }
})();

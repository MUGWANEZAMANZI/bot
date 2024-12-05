import { Team } from '../../database/models/Team.js';

export const name = 'create_team';
export const description = 'Create a new team (only for leaders).';

export const execute = async (interaction) => {
  const teamName = interaction.options.getString('name');
  const leaderId = interaction.user.id;

  const existingTeam = await Team.findOne({ where: { name: teamName } });
  if (existingTeam) {
    return interaction.reply('A team with this name already exists.');
  }

  await Team.create({ name: teamName, leaderId });
  await interaction.reply(`Team "${teamName}" has been created. You are the team leader.`);
};

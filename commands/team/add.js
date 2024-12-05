import { Team } from '../../database/models/Team.js';
import { checkLeaderPermissions } from '../../config/permissions.js';

export const name = 'add';
export const description = 'Add a member to your team (only for leaders).';

export const execute = async (interaction) => {
  const user = interaction.options.getUser('user');
  const leaderId = interaction.user.id;

  const team = await Team.findOne({ where: { leaderId } });
  if (!team) {
    return interaction.reply('You do not lead any team.');
  }

  await checkLeaderPermissions(interaction, team);

  await team.addMember(user.id);
  await interaction.reply(`<@${user.id}> has been added to your team.`);
};

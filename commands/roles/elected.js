export const name = 'elected';
export const description = 'Assign the role of team leader to a user.';

export const execute = async (interaction) => {
  const role = interaction.guild.roles.cache.find(r => r.name === 'Team Leader');
  const user = interaction.options.getUser('user');

  if (!role) return interaction.reply('The "Team Leader" role does not exist.');

  const member = interaction.guild.members.cache.get(user.id);
  await member.roles.add(role);

  await interaction.reply(`${user.tag} has been assigned the "Team Leader" role.`);
};

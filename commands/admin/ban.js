export const name = 'ban';
export const description = 'Ban a user from the server.';

export const execute = async (interaction) => {
  const user = interaction.options.getUser('user');
  const member = interaction.guild.members.cache.get(user.id);

  if (!member.bannable) {
    return interaction.reply('I cannot ban this user.');
  }

  await member.ban();
  await interaction.reply(`${user.tag} has been banned.`);
};

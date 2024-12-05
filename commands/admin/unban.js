export const name = 'unban';
export const description = 'Unban a user from the server.';

export const execute = async (interaction) => {
  const userId = interaction.options.getString('userId');
  
  try {
    await interaction.guild.members.unban(userId);
    await interaction.reply(`User with ID ${userId} has been unbanned.`);
  } catch (error) {
    await interaction.reply('Could not unban this user. Please check the ID.');
  }
};

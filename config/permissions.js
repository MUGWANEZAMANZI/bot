export const checkLeaderPermissions = async (interaction, team) => {
    if (interaction.user.id !== team.leaderId) {
      throw new Error('Only the team leader can perform this action.');
    }
  };
  
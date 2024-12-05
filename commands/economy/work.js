import { User } from '../../database/models/User.js';

export const name = 'work';
export const description = 'Earn random coins between 200 and 300.';

export const execute = async (interaction) => {
  const coinsEarned = Math.floor(Math.random() * 101) + 200;
  const user = await User.findOrCreate({ where: { discordId: interaction.user.id } });
  user[0].coins += coinsEarned;
  await user[0].save();

  await interaction.reply(`You worked and earned ${coinsEarned} coins! You now have ${user[0].coins} coins.`);
};

import { User } from '../../database/models/User.js';

export const name = 'buy';
export const description = 'Buy items like registration or submission forms.';

export const execute = async (interaction) => {
  const item = interaction.options.getString('item');
  const user = await User.findOne({ where: { discordId: interaction.user.id } });

  if (!user) return interaction.reply('You are not registered.');

  const prices = { registration: 500, submission: 300 };
  if (!prices[item]) return interaction.reply('Invalid item.');

  if (user.coins < prices[item]) {
    return interaction.reply('You do not have enough coins.');
  }

  user.coins -= prices[item];
  await user.save();
  await interaction.reply(`You have purchased a ${item} for ${prices[item]} coins.`);
};

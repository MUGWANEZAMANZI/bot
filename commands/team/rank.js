import { User } from '../../database/models/User.js';

export const name = 'rank';
export const description = 'Upgrade your rank (t1/t2/t3/t4) and earn an emoji.';

export const execute = async (interaction) => {
  const tier = interaction.options.getString('tier');
  const user = await User.findOne({ where: { discordId: interaction.user.id } });

  const tierPrices = { t1: 200, t2: 500, t3: 1000, t4: 2000 };
  const emojis = { t1: '🥉', t2: '🥈', t3: '🥇', t4: '🏆' };

  if (!tierPrices[tier]) {
    return interaction.reply('Invalid tier.');
  }

  if (user.coins < tierPrices[tier]) {
    return interaction.reply('You do not have enough coins.');
  }

  user.coins -= tierPrices[tier];
  user.tier = tier;
  await user.save();

  await interaction.reply(`You have been ranked to ${tier} (${emojis[tier]}).`);
};

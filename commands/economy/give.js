import { User } from '../../database/models/User.js';

export const name = 'give';
export const description = 'Give coins to another user.';

export const execute = async (interaction) => {
  const [mention, amount] = interaction.options.getString('input').split(' ');
  const targetId = mention.replace(/[<@!>]/g, '');
  const coinsToGive = parseInt(amount, 10);

  const giver = await User.findOrCreate({ where: { discordId: interaction.user.id } });
  const receiver = await User.findOrCreate({ where: { discordId: targetId } });

  if (giver[0].coins < coinsToGive) {
    return interaction.reply('You do not have enough coins.');
  }

  giver[0].coins -= coinsToGive;
  receiver[0].coins += coinsToGive;

  await giver[0].save();
  await receiver[0].save();

  await interaction.reply(`You gave ${coinsToGive} coins to <@${targetId}>.`);
};

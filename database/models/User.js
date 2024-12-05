import { DataTypes } from 'sequelize';
import { sequelize } from '../setup.js';

export const User = sequelize.define('User', {
  discordId: {
    type: DataTypes.STRING,
    unique: true,
  },
  coins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  tier: {
    type: DataTypes.STRING,
    defaultValue: 'none',
  },
});

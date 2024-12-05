import { DataTypes } from 'sequelize';
import { sequelize } from '../setup.js';

export const Team = sequelize.define('Team', {
  name: {
    type: DataTypes.STRING,
    unique: true,
  },
  leaderId: {
    type: DataTypes.STRING,
  },
});

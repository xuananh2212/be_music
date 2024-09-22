'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserHistory.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
      UserHistory.belongsTo(models.Song, {
        foreignKey: 'song_id',
      });
    }
  }
  UserHistory.init({
    user_id: DataTypes.STRING,
    song_id: DataTypes.STRING
  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'UserHistory',
  });
  return UserHistory;
};
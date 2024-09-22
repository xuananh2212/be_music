'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserHiddenSong extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserHiddenSong.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
      UserHiddenSong.belongsTo(models.Song, {
        foreignKey: 'song_id',
      });
    }
  }
  UserHiddenSong.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    user_id: DataTypes.STRING,
    song_id: DataTypes.STRING
  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'UserHiddenSong',
  });
  return UserHiddenSong;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserPlaylist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserPlaylist.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
      UserPlaylist.hasMany(models.PlaylistSong, {
        foreignKey: 'playlist_id',
      });
    }
  }
  UserPlaylist.init({
    user_id: DataTypes.STRING,
    name: DataTypes.STRING
  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'UserPlaylist',
  });
  return UserPlaylist;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.UserPlaylist, {
        foreignKey: 'user_id',
      });
      User.hasOne(models.Artist, {
        foreignKey: 'user_id',

      });
      User.belongsToMany(models.Song, {
        through: "UserFavorites",
        foreignKey: 'user_id',
        otherKey: 'song_id',
      });
      User.belongsToMany(models.Song, {
        through: "UserHiddenSongs",
        foreignKey: 'user_id',
        otherKey: 'song_id',
      });
    }
  }
  User.init({
    id: {
      type: DataTypes.STRING,
      autoIncrement: true,
      primaryKey: true,
    },
    user_name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    url_image: DataTypes.STRING,
    role: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    phone: DataTypes.STRING,
  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'User',
  });
  return User;
};
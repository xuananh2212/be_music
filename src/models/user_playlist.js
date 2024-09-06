"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User_Playlist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User_Playlist.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      User_Playlist.hasMany(models.Playlist_Song, {
        foreignKey: "playlist_id",
        onDelete: "CASCADE",
        as: "songs",
      });
    }
  }
  User_Playlist.init(
    {
      id: {
        type: DataTypes.STRING,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: DataTypes.STRING,
      name: DataTypes.STRING,
    },
    {
      sequelize,
      createdAt: "created_at",
      updatedAt: "updated_at",
      modelName: "User_Playlist",
    }
  );
  return User_Playlist;
};

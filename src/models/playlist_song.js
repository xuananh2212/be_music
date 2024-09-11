"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Playlist_Song extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Playlist_Song.belongsTo(models.User_Playlist, {
        foreignKey: "playlist_id",
        as: "playlist",
      });
      Playlist_Song.belongsTo(models.Song, {
        foreignKey: "song_id",
        as: "song"
      });
    }
  }
  Playlist_Song.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      playlist_id: DataTypes.STRING,
      song_id: DataTypes.STRING,
    },
    {
      sequelize,
      timestamps: false,
      modelName: "Playlist_Song",
    }
  );
  return Playlist_Song;
};

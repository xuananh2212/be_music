'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Song extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Song.belongsTo(models.Artist, {
        foreignKey: 'artist_id',
      });
      Song.belongsTo(models.Genre, { foreignKey: 'genre_id' });
      Song.belongsTo(models.Album, { foreignKey: 'album_id' });
      Song.hasMany(models.PlaylistSong, {
        foreignKey: 'song_id',
        onDelete: 'CASCADE'
      });
      Song.hasMany(models.UserFavorite, {
        foreignKey: 'song_id',
        onDelete: 'CASCADE'
      });
      Song.hasMany(models.UserHiddenSong, {
        foreignKey: 'song_id',
        onDelete: 'CASCADE'
      });
      Song.hasMany(models.UserHistory, {
        foreignKey: 'song_id',
        onDelete: 'CASCADE'
      });
      Song.hasMany(models.SongPart, {
        foreignKey: 'song_id',
        onDelete: 'CASCADE',
      });
      // models/song.js
      Song.hasMany(models.Comment, { foreignKey: 'song_id', onDelete: 'CASCADE' });

    }
  }
  Song.init({
    id: {
      type: DataTypes.STRING,
      autoIncrement: true,
      primaryKey: true,
    },
    album_id: DataTypes.STRING,
    image_url: DataTypes.STRING,
    title: DataTypes.STRING,
    file_url: DataTypes.STRING,
    video_url: DataTypes.STRING,
    duration: DataTypes.FLOAT,
    release_date: DataTypes.STRING,
    views: DataTypes.INTEGER,
    favorites: DataTypes.INTEGER,
    lyrics: DataTypes.TEXT,
    approved: DataTypes.BOOLEAN
  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'Song',
  });
  return Song;
};
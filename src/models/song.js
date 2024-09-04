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
      Song.belongsTo(models.Genre, { foreignKey: 'genre_id' });
      Song.belongsTo(models.Album, { foreignKey: 'album_id' });
    }
  }
  Song.init({
    id: {
      type: DataTypes.STRING,
      autoIncrement: true,
      primaryKey: true,
    },
    album_id: DataTypes.STRING,
    artist_id: DataTypes.STRING,
    title: DataTypes.STRING,
    file_url: DataTypes.STRING,
    video_url: DataTypes.STRING,
    duration: DataTypes.INTEGER,
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
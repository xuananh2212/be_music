'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PlaylistSong extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      PlaylistSong.belongsTo(models.UserPlaylist, {
        foreignKey: 'playlist_id',
      });

      // Assuming there's a Song model as well:
      PlaylistSong.belongsTo(models.Song, {
        foreignKey: 'song_id',
      });
    }
  }
  PlaylistSong.init({
    playlist_id: DataTypes.INTEGER,
    song_id: DataTypes.INTEGER
  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'PlaylistSong',
  });
  return PlaylistSong;
};
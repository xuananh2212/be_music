'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Album extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Album.hasMany(models.Song, { foreignKey: 'album_id' });
      Album.belongsTo(models.Artist, { foreignKey: 'artist_id' });
    }
  }
  Album.init({
    id: {
      type: DataTypes.STRING,
      autoIncrement: true,
      primaryKey: true,
    },
    artist_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    release_date: DataTypes.DATE,
    image_url: DataTypes.STRING,

  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'Album',
  });
  return Album;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Genre extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Genre.hasMany(models.Song, { foreignKey: 'genre_id' });
    }
  }
  Genre.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    image_url: DataTypes.STRING,
  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'Genre',
  });
  return Genre;
};
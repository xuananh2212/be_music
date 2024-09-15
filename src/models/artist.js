'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Artist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Artist.belongsTo(models.User, {
        foreignKey: 'user_id',

      });
      Artist.hasMany(models.Song, {
        foreignKey: 'artist_id',
      });
      Artist.hasMany(models.Album, {
        foreignKey: 'artist_id',
      });
    }
  }
  Artist.init({
    id: {
      type: DataTypes.STRING,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: DataTypes.STRING,
    stage_name: DataTypes.STRING,
    bio: DataTypes.STRING
  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'Artist',
  });
  return Artist;
};
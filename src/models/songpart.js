'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SongPart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SongPart.belongsTo(models.Song, {
        foreignKey: 'song_id',
        onDelete: 'CASCADE',
      });
    }
  }
  SongPart.init({
    id: {
      type: DataTypes.STRING,
      autoIncrement: true,
      primaryKey: true,
    },
    song_id: DataTypes.STRING,
    file_path: DataTypes.STRING,
    start_time: DataTypes.FLOAT,
    end_time: DataTypes.FLOAT
  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'SongPart',
  });
  return SongPart;
};
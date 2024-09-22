'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserFavorite extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserFavorite.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
      UserFavorite.belongsTo(models.Song, {
        foreignKey: 'song_id',
      });
    }
  }
  UserFavorite.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    user_id: DataTypes.STRING,
    song_id: DataTypes.STRING
  }, {
    sequelize,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    modelName: 'UserFavorite',
  });
  return UserFavorite;
};
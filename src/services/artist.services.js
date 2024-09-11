const { v4: uuidv4 } = require("uuid");
const { Artist, User } = require("../models/index");
const { Op } = require("sequelize");

module.exports = {
  createArtist: async (data) => {
    return await Artist.create({
      id: uuidv4(),
      ...data,
    });
  },

  findArtistById: async (id) => {
    return await Artist.findByPk(id);
  },
  findArtistByUserId: async (user_id) => {
    return await Artist.findOne({
      where: {
        user_id,
      },
    });
  },
  findByStageArtist: async (id, stage_name) => {
    return await Artist.findOne({
      where: {
        id: {
          [Op.ne]: id,
        },
        stage_name,
      },
    });
  },
  findOneByArtist: async (data) => {
    return await Artist.findOne({
      where: {
        ...data,
      },
    });
  },
  deleteManyArtist: async (artistIds) => {
    await Artist.destroy({
      where: {
        id: artistIds,
      },
    });
  },
  updateArtist: async function (user_id, data) {
    await Artist.update(
      {
        ...data,
      },
      {
        where: {
          user_id,
        },
      }
    );
    return await this.findArtistByUserId(user_id);
  },
  findAllArtist: async () => {
    return await Artist.findAll({
      include: {
        model: User,
        as: "user",
      },
    });
  },
  findProfileArtist: async (user_id) => {
    
    return await Artist.findOne({
      where: { user_id },
      include: {
        model: User,
        as: "user",
      },
    });
  },
};

const { v4: uuidv4 } = require("uuid");
const { Artist } = require("../models/index");

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
  findByStageArtist: async (stage_name) => {
    return await Artist.findOne({
      where: {
        stage_name,
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
};

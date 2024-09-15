const { v4: uuidv4 } = require("uuid");
const { User_Playlist, Playlist_Song, User } = require("../models/index");

module.exports = {
  createUserPlaylist: async (data) => {
    return await User_Playlist.create({
      id: uuidv4(),
      ...data,
    });
  },
  findUserPlaylistByName: async (name) => {
    return await User_Playlist.findOne({
      where: {
        name,
      },
    });
  },
  findUserPlaylistById: async (id) => {
    return await User_Playlist.findByPk(id);
  },
  deleteManyUserPlaylist: async (userPlaylists) => {
    await User_Playlist.destroy({
      where: {
        id: userPlaylists,
      },
    });
  },
  findAllUserPlaylist: async (data) => {
    const { user_id, limit, offset } = data;
    return await User_Playlist.findAndCountAll({
      where: { user_id },
      limit,
      offset,
      // include: {
      //   model: Playlist_Song,
      //   as: "songs",
      // },
    });
  },
  findAllPlaylist: async (data) => {
    const { limit, offset, include } = data;
    return await User_Playlist.findAndCountAll({
      limit,
      offset,
      include
      // include: {
      //   model: User,
      //   attributes: ["user_name"],
      // },
    });
  },
};

const { v4: uuidv4 } = require("uuid");
const { User_Playlist, Playlist_Song } = require("../models/index");

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
  findAllUserPlaylist: async (user_id) => {
    console.log(user_id);

    return await User_Playlist.findAll({
      where: { user_id },
      include: {
        model: Playlist_Song,
        as: "songs",
      },
    });
  },
};

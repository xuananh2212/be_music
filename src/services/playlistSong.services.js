const { v4: uuidv4 } = require("uuid");
const { User_Playlist, Playlist_Song } = require("../models/index");

module.exports = {
  createPlaylistSong: async (data) => {
    return await Playlist_Song.create(data);
  },
};

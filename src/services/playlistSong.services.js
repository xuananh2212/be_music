const { v4: uuidv4 } = require("uuid");
const { User_Playlist, Playlist_Song, Song } = require("../models/index");
const { Op } = require("sequelize");

module.exports = {
  createPlaylistSong: async (data) => {
    return await Playlist_Song.create({
      id: uuidv4(),
      ...data,
    });
  },
  createManyPlaylistSong: async (data) => {
    const { playlist_id, songs } = data;

    const songsDuplicate = await Playlist_Song.findAll({
      where: {
        playlist_id,
        song_id: {
          [Op.in]: songs,
        },
      },
    });

    const songsIdDuplicate = songsDuplicate.map((e) => e.dataValues.song_id);

    const newSongsId = songs.filter((item) => !songsIdDuplicate.includes(item));

    const result = newSongsId.map((song) => ({
      id: uuidv4(),
      playlist_id: playlist_id,
      song_id: song,
    }));

    return await Playlist_Song.bulkCreate(result);
  },
  findSongInPlaylist: async (data) => {
    console.log(data);

    const { playlist_id, song_id } = data;
    return await Playlist_Song.findOne({
      where: {
        [Op.and]: [{ playlist_id }, { song_id }],
      },
    });
  },
  findSongInPlaylistById: async (id) => {
    return await Playlist_Song.findByPk(id);
  },
  deleteOneSongInPlaylist: async (data) => {
    const { playlist_id, song_id } = data;
    await Playlist_Song.destroy({
      where: {
        [Op.and]: [{ playlist_id }, { song_id }],
      },
    });
  },
  deleteManySongInPlaylist: async (songsId) => {
    await Playlist_Song.destroy({
      where: {
        id: songsId,
      },
    });
  },
  findAllSongInPlaylist: async (data) => {
    const { playlist_id, limit, offset } = data;
    return await Playlist_Song.findAndCountAll({
      where: { playlist_id },
      limit,
      offset,
      include: [
        {
          model: User_Playlist,
          as: "playlist",
        },
        {
          model: Song,
          as: "song",
        },
      ],
    });
  },
};

const { object, string } = require("yup");
var _ = require("lodash");
const playlistSongServices = require("../../services/playlistSong.services");
module.exports = {
  handleAddSongToPlaylist: async (req, res) => {
    const response = {};
    try {
      let playlistSongSchema = object({
        playlistId: string().required("vui lòng chọn playlist"),
        songId: string().required("vui lòng chonj bài hát"),
      });

      const body = await playlistSongSchema.validate(req.body, {
        abortEarly: false,
      });

      const checkDuplicate = await playlistSongServices.findSongInPlaylist({
        playlist_id: body.playlistId,
        song_id: body.songId,
      });

      let song;

      if (!checkDuplicate) {
        song = await playlistSongServices.createPlaylistSong({
          playlist_id: body.playlistId,
          song_id: body.songId,
        });
        Object.assign(response, {
          status: 201,
          message: "Success",
          song: song,
        });
      } else {
        Object.assign(response, {
          status: 409,
          message: "Bài hát đã tồn tại trogn playlist",
        });
      }
    } catch (e) {
      let errors = {};
      if (e?.inner) {
        errors = Object.fromEntries(
          e.inner.map((item) => [item.path, item.message])
        );
      }
      Object.assign(response, {
        status: 400,
        message: "Yêu cầu không hợp lệ",
        errors: _.isEmpty(errors) ? e?.message : errors,
      });
    }
    return res.status(response.status).json(response);
  },
  handleAddManySongToPlaylist: async (req, res) => {
    const response = {};
    const { songs } = req.body;
    try {
      if (!Array.isArray(songs)) {
        throw new Error("Định dạng dữ liệu không hợp lệ!");
      }
      if (songs.length === 0) {
        throw new Error("danh sách id rỗng!");
      }
      let playlistSongSchema = object({
        playlistId: string().required("vui lòng nhập id playlist"),
      });

      const body = await playlistSongSchema.validate(req.body, {
        abortEarly: false,
      });

      const songAdded = await playlistSongServices.createManyPlaylistSong({
        playlist_id: body.playlistId,
        songs: req.body.songs,
      });

      Object.assign(response, {
        status: 201,
        message: "Success",
        songAdded,
      });
    } catch (e) {
      let errors = {};
      if (e?.inner) {
        errors = Object.fromEntries(
          e.inner.map((item) => [item.path, item.message])
        );
      }
      Object.assign(response, {
        status: 400,
        message: "Yêu cầu không hợp lệ",
        errors: _.isEmpty(errors) ? e?.message : errors,
      });
    }
    return res.status(response.status).json(response);
  },
  handleDeleteSongInPlaylist: async (req, res) => {
    const response = {};
    const { id } = req.params;
    try {
      const song = await playlistSongServices.findSongInPlaylistById(id);
      if (!song) {
        return res
          .status(404)
          .json({ status: 404, message: "song không tồn tại!" });
      }
      await song.destroy();
      Object.assign(response, {
        status: 200,
        message: "Xóa Thành công",
        song: id,
      });
    } catch (e) {
      Object.assign(response, {
        status: 400,
        message: e?.message,
      });
    }
    return res.status(response.status).json(response);
  },
  handleDeleteManySongInPlaylist: async (req, res) => {
    const response = {};
    const { songsId } = req.body;

    try {
      if (!Array.isArray(songsId)) {
        throw new Error("Định dạng dữ liệu không hợp lệ!");
      }
      if (songsId.length === 0) {
        throw new Error("danh sách id rỗng!");
      }
      await playlistSongServices.deleteManySongInPlaylist(songsId);

      Object.assign(response, {
        status: 200,
        message: "xóa Thành công",
        songsId,
      });
    } catch (e) {
      console.log(e);
      Object.assign(response, {
        status: 400,
        message: e.message,
      });
    }
    return res.status(response.status).json(response);
  },
  handleGetAllSongInPlaylist: async (req, res) => {
    const response = {};
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    console.log("page, limit", page, limit);
    const offset = (page - 1) * limit;

    try {
      let playlistSongSchema = object({
        playlistId: string().required("vui lòng nhập id playlist"),
      });

      const body = await playlistSongSchema.validate(req.body, {
        abortEarly: false,
      });

      const { count, rows: playlistSong } =
        await playlistSongServices.findAllSongInPlaylist({
          playlist_id: body.playlistId,
          limit: limit,
          offset: offset,
        });

      const totalPages = Math.ceil(count / limit);

      res.json({
        data: playlistSong,
        meta: {
          totalItems: count,
          currentPage: page,
          totalPages: totalPages,
          pageSize: limit,
        },
      });
    } catch (err) {
      res.status(500).json({ message: "Error fetching song in playlist", err });
    }
  },
};

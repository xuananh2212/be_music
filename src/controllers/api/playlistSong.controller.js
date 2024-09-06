const { object, string } = require("yup");
var _ = require("lodash");
const playlistSongServices = require("../../services/playlistSong.services");
module.exports = {
  handleAddSongToPlaylist: async (req, res) => {
    const response = {};
    try {
      let userPlaylistSchema = object({
        playlistId: string().required("vui lòng nhập"),
        songId: string().required("vui lòng nhập"),
      });

      console.log("1");

      const body = await userPlaylistSchema.validate(req.body, {
        abortEarly: false,
      });

      console.log("2");

      const song = await playlistSongServices.createPlaylistSong({
        playlist_id: body.playlistId,
        song_id: body.songId,
      });

      console.log("3");

      Object.assign(response, {
        status: 201,
        message: "Success",
        song: song,
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
};

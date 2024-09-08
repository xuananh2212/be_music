var express = require("express");
const playlistSongController = require("../../controllers/api/playlistSong.controller");
var router = express.Router();
router.post(
  "/add/many-songs",
  playlistSongController.handleAddManySongToPlaylist
);
router.post("/", playlistSongController.handleAddSongToPlaylist);
router.get("/", playlistSongController.handleGetAllSongInPlaylist);
router.delete(
  "/delete/many-song-playlist",
  playlistSongController.handleDeleteManySongInPlaylist
);
router.delete("/:id", playlistSongController.handleDeleteSongInPlaylist);
// router.put("/:id", userPlaylistController.handleEditNameUserPlaylist);
module.exports = router;

var express = require("express");
const playlistSongController = require("../../controllers/api/playlistSong.controller");
var router = express.Router();
router.post("/", playlistSongController.handleAddSongToPlaylist);
// router.get("/", userPlaylistController.handleGetAllUserPlaylist);
// router.delete(
//   "/delete/many-playlist",
//   userPlaylistController.handleDeleteManyUserPlaylist
// );
// router.delete("/:id", userPlaylistController.handleDeleteUserPlaylist);
// router.put("/:id", userPlaylistController.handleEditNameUserPlaylist);
module.exports = router;

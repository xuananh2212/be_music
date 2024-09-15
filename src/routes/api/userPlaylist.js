var express = require("express");
const userPlaylistController = require("../../controllers/api/userPlaylist.controller");
var router = express.Router();
router.post("/", userPlaylistController.handleCreatePlaylist);
router.get("/all", userPlaylistController.handleGetAllPlaylist);
router.get("/", userPlaylistController.handleGetAllUserPlaylist);
router.delete(
  "/delete/many-playlist",
  userPlaylistController.handleDeleteManyUserPlaylist
);
router.delete("/:id", userPlaylistController.handleDeleteUserPlaylist);
router.put("/:id", userPlaylistController.handleEditNameUserPlaylist);
module.exports = router;

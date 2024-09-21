var express = require("express");
const playlistController = require("../../controllers/api/playlist.controller");
var router = express.Router();
router.get("/get-all", playlistController.handleGetAllPage);
router.post("/", playlistController.handleCreate);
module.exports = router;

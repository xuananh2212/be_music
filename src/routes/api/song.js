var express = require('express');
const songController = require('../../controllers/api/song.controller');
var router = express.Router();
router.post('/', songController.handleCreate);
router.get('/', songController.handleGetAll);
router.get('/get-all', songController.handleGetAllPage);
router.get("/get-favourite-songs", songController.handleGetFavouriteSongs);
router.post("/add-favourite-song", songController.handleAddFavouriteSongs);
router.post("/play", songController.handlePlaySongs);
router.delete("/remove-favourite-song", songController.handleRemoveFavouriteSongs);
router.post("/add-hide-song", songController.handleAddHideSong);
router.delete("/unhide-song", songController.handleUnHideSong);
router.get("/get-hidden-songs", songController.handleGetHiddenSongs);
router.get("/get-recently-songs", songController.handleGetRecentlySongs);
router.get("/songs-for-you", songController.handleSongForYou)
module.exports = router;
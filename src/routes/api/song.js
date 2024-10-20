var express = require('express');
const songController = require('../../controllers/api/song.controller');
var router = express.Router();
router.post('/', songController.handleCreate);
router.get('/', songController.handleGetAll);
router.get("/get-trending", songController.getTrendingSongs);
router.get('/listen-count', songController.handleListenCount)
router.get('/get-all', songController.handleGetAllPage);
router.get("/get-favourite-songs", songController.handleGetFavouriteSongs);
router.post("/add-favourite-song", songController.handleAddFavouriteSongs);
router.post("/play", songController.handlePlaySongs);
router.post("/remove-favourite-song", songController.handleRemoveFavouriteSongs);

router.post("/add-hide-song", songController.handleAddHideSong);
router.get("/check-favorite", songController.handleCheckFavorite)
router.post("/unhide-song", songController.handleUnHideSong);
router.post("/unhide-songs", songController.handleUnHideSongs);
router.get("/get-hidden-songs", songController.handleGetHiddenSongs);
router.get("/get-recently-songs", songController.handleGetRecentlySongs);
router.get("/songs-for-you", songController.handleSongForYou);
router.delete("/:id", songController.handleDelete);
router.post("/:id", songController.handleUpdate);
router.get("/:id", songController.handleGetDetail);
module.exports = router;
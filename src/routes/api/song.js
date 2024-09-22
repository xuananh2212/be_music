var express = require('express');
const songController = require('../../controllers/api/song.controller');
var router = express.Router();
router.post('/', songController.handleCreate);
router.get('/', songController.handleGetAll);
router.get("/get-favourite-songs", songController.handleGetFavouriteSongs);
router.post("/add-favourite-song", songController.handleAddFavouriteSongs);
router.post("/remove-favourite-song", songController.handleRemoveFavouriteSongs);
module.exports = router;
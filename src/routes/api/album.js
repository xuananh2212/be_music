var express = require('express');
const artistController = require('../../controllers/api/artist.controller');
var router = express.Router();
router.delete('/delete/many-album', artistController.handleDeleteManyArtist);
router.post('/:id', artistController.handleCreateArtist);
router.delete('/:id', artistController.handleDeleteArtist);
router.put('/:id', artistController.handleEditArtist);
module.exports = router;
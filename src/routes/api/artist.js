var express = require('express');
const artistController = require('../../controllers/api/artist.controller');
var router = express.Router();
router.delete('/delete/many-artist', artistController.handleDeleteManyArtist);
router.post('/', artistController.handleCreateArtist);
router.delete('/:id', artistController.handleDeleteArtist);
router.put('/:id', artistController.handleEditArtist);
module.exports = router;
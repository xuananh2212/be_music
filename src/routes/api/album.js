var express = require('express');
const albumController = require('../../controllers/api/album.controller');
var router = express.Router();
router.post('/', albumController.handleCreate);
router.post('/:id', albumController.handleUpdate);
router.get('/', albumController.handleGetAll);
router.get('/:id', albumController.handleGetDetail);
router.delete('/:id', albumController.handleDelete);
module.exports = router;
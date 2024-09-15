var express = require('express');
const genreController = require('../../controllers/api/genre.controller');
var router = express.Router();
router.post('/', genreController.handleCreate);
router.post('/:id', genreController.handleUpdate);
router.get('/', genreController.handleGetAll);
router.get('/:id', genreController.handleGetDetail);
router.delete('/:id', genreController.handleDelete);
module.exports = router;
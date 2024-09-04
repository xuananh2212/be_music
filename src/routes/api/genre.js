var express = require('express');
const genreController = require('../../controllers/api/genre.controller');
var router = express.Router();
router.post('/', genreController.handleCreate);
router.get('/', genreController.handleGetAll);
module.exports = router;
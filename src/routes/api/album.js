var express = require('express');
const albumController = require('../../controllers/api/album.controller');
var router = express.Router();
router.post('/', albumController.handleCreate);
router.get('/', albumController.handleGetAll);
module.exports = router;
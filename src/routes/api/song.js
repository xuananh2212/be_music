var express = require('express');
const songController = require('../../controllers/api/song.controller');
var router = express.Router();
router.post('/', songController.handleCreate);
router.get('/', songController.handleGetAll);
module.exports = router;
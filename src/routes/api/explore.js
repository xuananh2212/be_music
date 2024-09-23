var express = require('express');
const songController = require('../../controllers/api/song.controller');
var router = express.Router();;
router.get("/", songController.handleExplore)
module.exports = router;
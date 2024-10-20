var express = require('express');
const commentController = require('../../controllers/api/comment.controller');
var router = express.Router();
router.post('/', commentController.handleAdd);
router.get('/:id', commentController.handleGetSongDetail);
module.exports = router;
const express = require('express');
const router = express.Router();
const upload = require("../../middlewares/multer");
const uploadController = require("../../controllers/api/upload.controller");
router.post(
     '/image',
     upload.single('image'),
     uploadController.handleUploadImage);
router.post(
     '/video',
     upload.single('file'),
     uploadController.handleUploadVideo);
module.exports = router;
var express = require("express");

var router = express.Router();

const authRouter = require('./api/auth');
const userRouter = require('./api/user');
const artistRouter = require('./api/artist');
const uploadRouter = require('./api/upload');
const genreRouter = require('./api/genre');
const albumRouter = require('./api/album');
const songRouter = require('./api/song');
var verifyToken = require('../middlewares/verifyToken');

router.use("/auth/v1", authRouter);
router.use(verifyToken);
router.use("/user/v1", userRouter);
router.use("/artist/v1", artistRouter);
router.use("/upload/v1", uploadRouter);
router.use("/genre/v1", genreRouter);
router.use("/album/v1", albumRouter);
router.use("/song/v1", songRouter);
module.exports = router;
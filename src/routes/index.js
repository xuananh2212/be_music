var express = require("express");

var router = express.Router();

const authRouter = require('./api/auth');
const userRouter = require('./api/user');
const artistRouter = require('./api/artist');
const uploadRouter = require('./api/upload-v1');
const uploadRouterV2 = require('./api/upload-v2');
const genreRouter = require('./api/genre');
const albumRouter = require('./api/album');
const songRouter = require('./api/song');
const exploreRouter = require('./api/explore');
const playlistRouter = require('./api/playlist');
var verifyToken = require('../middlewares/verifyToken');

router.use("/auth/v1", authRouter);
router.use(verifyToken);
router.use("/user/v1", userRouter);
router.use("/artist/v1", artistRouter);
router.use("/upload/v1", uploadRouter);
router.use("/upload/v2", uploadRouterV2);
router.use("/genre/v1", genreRouter);
router.use("/album/v1", albumRouter);
router.use("/song/v1", songRouter);
router.use("/explore/v1", exploreRouter);
router.use("/play-list/v1", playlistRouter);
module.exports = router;
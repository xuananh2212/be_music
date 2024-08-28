var express = require("express");

var router = express.Router();

const authRouter = require('./api/auth');
const userRouter = require('./api/user');
const artistRouter = require('./api/artist');
const uploadRouter = require('./api/upload');
var verifyToken = require('../middlewares/verifyToken');

router.use("/auth/v1", authRouter);
router.use(verifyToken);
router.use("/user/v1", userRouter);
router.use("/artist/v1", artistRouter);
router.use("/upload/v1", uploadRouter);
module.exports = router;
var express = require("express");
const userHistory = require("../../controllers/api/user-history");
var router = express.Router();
router.get("/get-all", userHistory.getAllUserHistory);

module.exports = router;

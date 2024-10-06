var express = require('express');
const dashboardController = require('../../controllers/api/dashboard.controller');
var router = express.Router();
router.get('/total-count', dashboardController.getTotalCounts);
module.exports = router;
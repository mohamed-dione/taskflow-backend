const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewars/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

router.use(verifyToken);
router.get('/stats', dashboardController.getStats);

module.exports = router;
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');

// Route protégée pour récupérer les statistiques du dashboard
router.get('/dashboard/stats', statsController.getDashboardStats);

module.exports = router;
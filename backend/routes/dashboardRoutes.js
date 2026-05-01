const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/kpi', dashboardController.getKpi);
router.get('/monthly', dashboardController.getMonthlyData);
router.get('/absence-reasons', dashboardController.getAbsenceReasons);
router.get('/top-absences', dashboardController.getTopAbsences);
router.get('/top-overtime', dashboardController.getTopOvertime);

module.exports = router;  // ← IMPORTANT: must export router
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/kpi', dashboardController.getKpi);
router.get('/enhanced-kpi', dashboardController.getEnhancedKpi);
router.get('/monthly', dashboardController.getMonthlyData);
router.get('/absence-reasons', dashboardController.getAbsenceReasons);
router.get('/top-absences', dashboardController.getTopAbsences);
router.get('/top-overtime', dashboardController.getTopOvertime);
router.get('/employees-by-department', dashboardController.getEmployeesByDepartment);
router.get('/overtime-by-department', dashboardController.getOvertimeByDepartment);
router.get('/ai-risks', dashboardController.getAiRiskIndicators);
router.get('/department-risks', dashboardController.getDepartmentRisks);
router.get('/top-risk-employees', dashboardController.getTopRiskEmployees);
router.post('/sync', dashboardController.syncCollections);

module.exports = router;  // ← IMPORTANT: must export router

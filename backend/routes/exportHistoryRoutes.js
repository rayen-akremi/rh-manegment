const express = require('express');
const router = express.Router();
const exportHistoryController = require('../controllers/exportHistoryController');

router.get('/', exportHistoryController.getAllExports);
router.get('/type/:type', exportHistoryController.getExportsByType);
router.get('/:id', exportHistoryController.getExportById);
router.get('/stats/summary', exportHistoryController.getExportStats);
router.delete('/:id', exportHistoryController.deleteExportRecord);

module.exports = router;
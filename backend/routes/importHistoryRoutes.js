const express = require('express');
const router = express.Router();
const importHistoryController = require('../controllers/importHistoryController');

router.get('/', importHistoryController.getAllImports);
router.get('/type/:type', importHistoryController.getImportsByType);
router.get('/:id', importHistoryController.getImportById);
router.delete('/:id', importHistoryController.deleteImportRecord);

module.exports = router;
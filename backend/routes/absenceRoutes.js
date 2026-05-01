const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absenceController');

router.get('/', absenceController.getAllAbsences);
router.post('/', absenceController.createAbsence);
router.put('/:id', absenceController.updateAbsence);
router.delete('/:id', absenceController.deleteAbsence);

module.exports = router;
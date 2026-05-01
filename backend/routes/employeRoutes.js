const express = require('express');
const router = express.Router();
const employeController = require('../controllers/employeController');

router.get('/', employeController.getAllEmployees);
router.post('/', employeController.createEmployee);
router.put('/:id', employeController.updateEmployee);
router.delete('/:id', employeController.deleteEmployee);

module.exports = router;  // ← IMPORTANT: must export router
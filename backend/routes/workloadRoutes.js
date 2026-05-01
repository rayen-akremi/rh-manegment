const express = require('express');
const router = express.Router();
const workloadController = require('../controllers/workloadController');

router.get('/', workloadController.getAllWorkloads);
router.post('/', workloadController.createWorkload);
router.put('/:id', workloadController.updateWorkload);
router.delete('/:id', workloadController.deleteWorkload);

module.exports = router;
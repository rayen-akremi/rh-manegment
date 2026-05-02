// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiPythonClient = require('../services/aiPythonClient');

// Health check - checks if Python AI service is running
router.get('/health', async (req, res) => {
  const health = await aiPythonClient.healthCheck();
  res.json(health);
});

// Predict absence for next month
router.post('/predict-absence/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { months = 6 } = req.body;
    const result = await aiPythonClient.predictAbsence(employeeId, months);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Predict turnover risk (departure risk)
router.post('/predict-turnover/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await aiPythonClient.predictTurnover(employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Predict workload overload risk
router.post('/predict-workload/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await aiPythonClient.predictWorkload(employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch predictions for all employees
router.post('/batch-predict', async (req, res) => {
  try {
    const result = await aiPythonClient.batchPredict();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get department risks
router.get('/department-risks', async (req, res) => {
  try {
    const result = await aiPythonClient.getDepartmentRisks();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint for an employee
router.get('/debug/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await aiPythonClient.debugEmployee(employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
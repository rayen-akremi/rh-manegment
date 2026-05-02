// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiService = require('../services/aiPredictionService');
const aiDbService = require('../services/aiDatabaseService');
const Absence = require('../models/Absence');

router.post('/predict-absence/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { months = 6 } = req.body;
    
    const employee = await aiDbService.getEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const absenceHistory = await aiDbService.getEmployeeAbsenceHistory(employeeId, months);
    
    if (absenceHistory.length < 3) {
      return res.json({
        employeeId,
        employeeName: employee.name,
        predictedAbsenceDays: 0,
        predictedAbsenceRate: 0,
        error: 'Insufficient data (need at least 3 months of absence history)',
        historicalData: absenceHistory
      });
    }
    
    const prediction = aiService.predictAbsence(absenceHistory, employee.name, employeeId);
    res.json(prediction);
    
  } catch (error) {
    console.error('Error predicting absence:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/predict-turnover/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employee = await aiDbService.getEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const deptAverages = await aiDbService.getDepartmentAverages();
    const avgDeptWeekly = deptAverages[employee.department] || 40;
    
    const risk = aiService.predictTurnoverRisk(
      employee.weeklyHours,
      employee.overtimeHours,
      employee.absenceDaysRecent,
      employee.performanceScore,
      employee.department,
      avgDeptWeekly
    );
    
    res.json({
      employeeId,
      employeeName: employee.name,
      department: employee.department,
      ...risk
    });
    
  } catch (error) {
    console.error('Error predicting turnover:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/predict-workload/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employee = await aiDbService.getEmployeeById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const risk = aiService.predictWorkloadOverload(
      employee.weeklyHours,
      employee.overtimeHours
    );
    
    res.json({
      employeeId,
      employeeName: employee.name,
      ...risk
    });
    
  } catch (error) {
    console.error('Error predicting workload:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/department-risks', async (req, res) => {
  try {
    const risks = await aiDbService.getDepartmentTurnoverRisk();
    res.json(risks);
  } catch (error) {
    console.error('Error getting department risks:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch-predict', async (req, res) => {
  try {
    const employees = await aiDbService.getAllEmployeesWithWorkload();
    const deptAverages = await aiDbService.getDepartmentAverages();
    
    const results = {
      absences: [],
      turnover: [],
      workload: [],
      summary: {
        highRiskTurnover: 0,
        criticalWorkload: 0,
        totalEmployees: employees.length
      }
    };
    
    for (const emp of employees) {
      const absenceHistory = await aiDbService.getEmployeeAbsenceHistory(emp.id, 6);
      if (absenceHistory.length >= 3) {
        results.absences.push(aiService.predictAbsence(absenceHistory, emp.name, emp.id));
      }
      
      const avgDeptWeekly = deptAverages[emp.department] || 40;
      const turnoverRisk = aiService.predictTurnoverRisk(
        emp.weeklyHours, emp.overtimeHours, emp.absenceDaysRecent,
        emp.performanceScore, emp.department, avgDeptWeekly
      );
      results.turnover.push({ employeeId: emp.id, employeeName: emp.name, ...turnoverRisk });
      if (turnoverRisk.riskLevel === 'High' || turnoverRisk.riskLevel === 'Critical') {
        results.summary.highRiskTurnover++;
      }
      
      const workloadRisk = aiService.predictWorkloadOverload(emp.weeklyHours, emp.overtimeHours);
      results.workload.push({ employeeId: emp.id, employeeName: emp.name, ...workloadRisk });
      if (workloadRisk.status === 'Critical') {
        results.summary.criticalWorkload++;
      }
    }
    
    results.departments = await aiDbService.getDepartmentTurnoverRisk();
    res.json(results);
    
  } catch (error) {
    console.error('Error in batch prediction:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/debug/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const absences = await Absence.find({ employee_id: employeeId }).sort({ startDate: 1 });
    
    const monthlyMap = new Map();
    absences.forEach(absence => {
      const date = new Date(absence.startDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + absence.days);
    });
    
    res.json({
      employeeId,
      totalAbsences: absences.length,
      absences: absences.map(a => ({
        startDate: a.startDate,
        days: a.days,
        type: a.type
      })),
      monthlyValues: Array.from(monthlyMap.values())
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'AI Service is running', version: '1.0' });
});

module.exports = router;
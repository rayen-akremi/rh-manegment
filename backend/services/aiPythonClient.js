// backend/services/aiPythonClient.js
const axios = require('axios');

const PYTHON_AI_URL = 'http://localhost:5001';

class AIPythonClient {
  
  // Health check
  async healthCheck() {
    try {
      const response = await axios.get(`${PYTHON_AI_URL}/health`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      console.error('❌ Python AI service unavailable:', error.message);
      return { status: 'unavailable', error: error.message };
    }
  }

  // Predict absence
  async predictAbsence(employeeId, months = 6) {
    try {
      const response = await axios.post(`${PYTHON_AI_URL}/predict/absence/${employeeId}?months=${months}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error predicting absence for ${employeeId}:`, error.message);
      return {
        employeeId,
        employeeName: 'Unknown',
        predictedAbsenceDays: 0,
        predictedAbsenceRate: 0,
        trend: 'stable',
        error: 'AI service unavailable'
      };
    }
  }

  // Predict turnover risk
  async predictTurnover(employeeId) {
    try {
      const response = await axios.post(`${PYTHON_AI_URL}/predict/turnover/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error predicting turnover for ${employeeId}:`, error.message);
      return {
        employeeId,
        employeeName: 'Unknown',
        riskScore: 0,
        riskLevel: 'Unknown',
        error: 'AI service unavailable'
      };
    }
  }

  // Predict workload overload
  async predictWorkload(employeeId) {
    try {
      const response = await axios.post(`${PYTHON_AI_URL}/predict/workload/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error predicting workload for ${employeeId}:`, error.message);
      return {
        employeeId,
        employeeName: 'Unknown',
        overloadScore: 0,
        status: 'Unknown',
        error: 'AI service unavailable'
      };
    }
  }

  // Batch predictions
  async batchPredict() {
    try {
      const response = await axios.post(`${PYTHON_AI_URL}/batch-predict`, {}, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error('❌ Error in batch prediction:', error.message);
      return { 
        absences: [], 
        turnover: [], 
        workload: [],
        summary: { highRiskTurnover: 0, criticalWorkload: 0, totalEmployees: 0 },
        error: 'AI service unavailable' 
      };
    }
  }

  // Department risks
  async getDepartmentRisks() {
    try {
      const response = await axios.get(`${PYTHON_AI_URL}/department-risks`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting department risks:', error.message);
      return [];
    }
  }

  // Debug employee
  async debugEmployee(employeeId) {
    try {
      const response = await axios.get(`${PYTHON_AI_URL}/debug/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error debugging employee ${employeeId}:`, error.message);
      return null;
    }
  }
}

module.exports = new AIPythonClient();
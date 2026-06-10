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

  // ========== Get turnover trend for next 6 months ==========
  async getTurnoverTrend() {
    try {
      // Try to get from Python service
      const response = await axios.get(`${PYTHON_AI_URL}/turnover-trend`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.log('⚠️ Python service for turnover trend unavailable, calculating locally...');
      // If Python service fails, calculate locally
      return await this.calculateLocalTurnoverTrend();
    }
  }

  // ========== Calculate turnover trend locally (fallback) ==========
  async calculateLocalTurnoverTrend() {
    try {
      // Import models
      const Employe = require('../models/Employe');
      const Workload = require('../models/Workload');
      const Absence = require('../models/Absence');
      const TurnoverDeparture = require('../models/TurnoverDeparture');
      
      const employees = await Employe.find();
      const workloads = await Workload.find();
      const absences = await Absence.find();
      const departures = await TurnoverDeparture.find();
      
      const totalEmployees = employees.length;
      
      if (totalEmployees === 0) {
        // Return default data if no employees
        return [
          { month: 'Jan', risk: 25 },
          { month: 'Fév', risk: 28 },
          { month: 'Mar', risk: 30 },
          { month: 'Avr', risk: 32 },
          { month: 'Mai', risk: 35 },
          { month: 'Juin', risk: 38 }
        ];
      }
      
      // Calculate average overload score
      let totalOverload = 0;
      workloads.forEach(w => { totalOverload += w.overtimeHours || 0; });
      const avgOverload = totalEmployees > 0 ? (totalOverload / totalEmployees) : 20;
      
      // Calculate absence rate
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const recentAbsences = absences.filter(a => new Date(a.startDate) > threeMonthsAgo);
      const avgAbsenceRate = totalEmployees > 0 ? (recentAbsences.length / totalEmployees) * 100 : 15;
      
      // Calculate historical turnover rate
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentDepartures = departures.filter(d => new Date(d.date) > sixMonthsAgo);
      const historicalTurnoverRate = totalEmployees > 0 ? (recentDepartures.length / totalEmployees) * 100 : 10;
      
      // Generate trend for next 6 months
      const months = [];
      const currentDate = new Date();
      
      // Base risk calculation
      let baseRisk = Math.max(10, Math.min(80, 
        historicalTurnoverRate + (avgOverload / 15) + (avgAbsenceRate / 8)
      ));
      
      for (let i = 0; i < 6; i++) {
        const date = new Date(currentDate);
        date.setMonth(currentDate.getMonth() + i);
        const monthName = date.toLocaleString('fr-FR', { month: 'short' });
        
        // Seasonal variation
        let seasonalFactor = 0;
        const month = date.getMonth();
        if (month === 5 || month === 6 || month === 7) { // June, July, August
          seasonalFactor = 5; // Higher turnover in summer
        } else if (month === 11) { // December
          seasonalFactor = 3;
        } else if (month === 0) { // January
          seasonalFactor = 2;
        }
        
        // Calculate risk with trend (slight increase over time)
        let risk = baseRisk + (i * 1.5) + seasonalFactor;
        risk = Math.min(90, Math.max(5, Math.round(risk)));
        
        months.push({
          month: monthName,
          risk: risk
        });
      }
      
      console.log('📊 Local turnover trend calculated:', months);
      return months;
      
    } catch (error) {
      console.error('❌ Error calculating local turnover trend:', error);
      // Return default data if everything fails
      return [
        { month: 'Jan', risk: 25 },
        { month: 'Fév', risk: 28 },
        { month: 'Mar', risk: 30 },
        { month: 'Avr', risk: 32 },
        { month: 'Mai', risk: 35 },
        { month: 'Juin', risk: 38 }
      ];
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
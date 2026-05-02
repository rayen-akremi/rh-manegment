// backend/services/databaseService.js
// Uses your actual Mongoose models

const Absence = require('../models/Absence');
const Employe = require('../models/Employe');
const Workload = require('../models/Workload');
const TurnoverHistory = require('../models/TurnoverHistory');

class DatabaseService {
  
  /**
   * Get employee absence history for last N months
   */
  async getEmployeeAbsenceHistory(employeeId, monthsCount = 6) {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - monthsCount);
    
    const absences = await Absence.aggregate([
      { 
        $match: { 
          employee_id: employeeId,
          startDate: { $gte: monthsAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$startDate" } },
          totalDays: { $sum: "$days" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return absences.map(a => a.totalDays);
  }

  /**
   * Get all employees with their recent workload data
   */
  async getAllEmployeesWithWorkload() {
    const employees = await Employe.find({});
    const workloads = await Workload.find({});
    
    // Create a map of employee_id to workload data
    const workloadMap = new Map();
    workloads.forEach(w => {
      if (!workloadMap.has(w.employee_id)) {
        workloadMap.set(w.employee_id, { weeklyHours: [], overtimeHours: [] });
      }
      const data = workloadMap.get(w.employee_id);
      data.weeklyHours.push(w.weeklyHours);
      data.overtimeHours.push(w.overtimeHours);
    });
    
    // Get absences for last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const absences = await Absence.aggregate([
      { $match: { startDate: { $gte: threeMonthsAgo } } },
      { $group: { _id: "$employee_id", totalDays: { $sum: "$days" } } }
    ]);
    
    const absenceMap = new Map();
    absences.forEach(a => absenceMap.set(a._id, a.totalDays));
    
    return employees.map(emp => {
      const workload = workloadMap.get(emp.employee_id) || { weeklyHours: [40], overtimeHours: [0] };
      const avgWeeklyHours = workload.weeklyHours.reduce((a,b) => a+b, 0) / workload.weeklyHours.length;
      const avgOvertimeHours = workload.overtimeHours.reduce((a,b) => a+b, 0) / workload.overtimeHours.length;
      
      return {
        id: emp.employee_id,
        name: `${emp.prenom} ${emp.nom}`,
        department: emp.departement,
        weeklyHours: Math.round(avgWeeklyHours),
        overtimeHours: Math.round(avgOvertimeHours),
        absenceDaysRecent: absenceMap.get(emp.employee_id) || 0,
        performanceScore: 75 // Default if not in your model
      };
    });
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(employeeId) {
    const emp = await Employe.findOne({ employee_id: employeeId });
    if (!emp) return null;
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const absences = await Absence.aggregate([
      { $match: { employee_id: employeeId, startDate: { $gte: threeMonthsAgo } } },
      { $group: { _id: null, total: { $sum: "$days" } } }
    ]);
    
    const workloads = await Workload.find({ employee_id: employeeId });
    const avgWeekly = workloads.length > 0 
      ? workloads.reduce((a,b) => a + b.weeklyHours, 0) / workloads.length 
      : 40;
    const avgOvertime = workloads.length > 0 
      ? workloads.reduce((a,b) => a + b.overtimeHours, 0) / workloads.length 
      : 0;
    
    return {
      id: emp.employee_id,
      name: `${emp.prenom} ${emp.nom}`,
      department: emp.departement,
      weeklyHours: Math.round(avgWeekly),
      overtimeHours: Math.round(avgOvertime),
      absenceDaysRecent: absences[0]?.total || 0,
      performanceScore: 75
    };
  }

  /**
   * Get department average weekly hours
   */
  async getDepartmentAverages() {
    const employees = await Employe.find({});
    const workloads = await Workload.find({});
    
    const deptHours = new Map();
    const deptCount = new Map();
    
    workloads.forEach(w => {
      const emp = employees.find(e => e.employee_id === w.employee_id);
      if (emp) {
        const dept = emp.departement;
        deptHours.set(dept, (deptHours.get(dept) || 0) + w.weeklyHours);
        deptCount.set(dept, (deptCount.get(dept) || 0) + 1);
      }
    });
    
    const averages = {};
    for (const [dept, total] of deptHours) {
      averages[dept] = total / deptCount.get(dept);
    }
    return averages;
  }

  /**
   * Get department turnover risk summary
   */
  async getDepartmentTurnoverRisk() {
    const employees = await this.getAllEmployeesWithWorkload();
    const deptMap = new Map();
    
    employees.forEach(emp => {
      if (!deptMap.has(emp.department)) {
        deptMap.set(emp.department, { employees: [], totalWeekly: 0, totalOvertime: 0, totalAbsence: 0, count: 0 });
      }
      const dept = deptMap.get(emp.department);
      dept.employees.push(emp);
      dept.totalWeekly += emp.weeklyHours;
      dept.totalOvertime += emp.overtimeHours;
      dept.totalAbsence += emp.absenceDaysRecent;
      dept.count++;
    });
    
    const results = [];
    for (const [deptName, data] of deptMap) {
      const avgWeekly = data.totalWeekly / data.count;
      const avgOvertime = data.totalOvertime / data.count;
      const avgAbsence = data.totalAbsence / data.count;
      
      let riskScore = 0;
      if (avgWeekly > 48) riskScore += 40;
      else if (avgWeekly > 45) riskScore += 25;
      if (avgOvertime > 20) riskScore += 35;
      else if (avgOvertime > 12) riskScore += 20;
      if (avgAbsence > 8) riskScore += 25;
      else if (avgAbsence > 4) riskScore += 10;
      
      riskScore = Math.min(100, riskScore);
      
      let riskLevel = 'Low';
      if (riskScore >= 70) riskLevel = 'Critical';
      else if (riskScore >= 50) riskLevel = 'High';
      else if (riskScore >= 30) riskLevel = 'Medium';
      
      results.push({
        department: deptName,
        riskScore: Math.round(riskScore),
        riskLevel,
        avgWeeklyHours: Math.round(avgWeekly * 10) / 10,
        avgOvertimeHours: Math.round(avgOvertime * 10) / 10,
        avgAbsenceDays: Math.round(avgAbsence * 10) / 10,
        employeeCount: data.count,
        employeesAtRisk: data.employees.filter(e => e.weeklyHours > 48 || e.overtimeHours > 15).map(e => e.name)
      });
    }
    
    return results.sort((a, b) => b.riskScore - a.riskScore);
  }
}

module.exports = new DatabaseService();
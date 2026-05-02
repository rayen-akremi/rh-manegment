// backend/services/aiDatabaseService.js
const Employe = require('../models/Employe');
const Absence = require('../models/Absence');
const Workload = require('../models/Workload');

class AIDatabaseService {
  
  async getEmployeeAbsenceHistory(employeeId, monthsCount = 6) {
    try {
      const result = await Absence.aggregate([
        { $match: { employee_id: employeeId } },
        {
          $group: {
            _id: {
              year: { $year: "$startDate" },
              month: { $month: "$startDate" }
            },
            totalDays: { $sum: "$days" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);
      
      const monthlyDays = result.map(r => r.totalDays);
      
      console.log(`Employee ${employeeId} - Monthly absences:`, monthlyDays);
      
      if (monthlyDays.length > monthsCount) {
        return monthlyDays.slice(-monthsCount);
      }
      
      return monthlyDays;
      
    } catch (error) {
      console.error('Error in getEmployeeAbsenceHistory:', error);
      return [];
    }
  }

  async getEmployeeById(employeeId) {
    try {
      const emp = await Employe.findOne({ employee_id: employeeId });
      if (!emp) return null;
      
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      threeMonthsAgo.setHours(0, 0, 0, 0);
      
      const absences = await Absence.find({
        employee_id: employeeId,
        startDate: { $gte: threeMonthsAgo }
      });
      
      const totalAbsenceDays = absences.reduce((sum, a) => sum + a.days, 0);
      
      const workloads = await Workload.find({ employee_id: employeeId });
      
      const avgWeeklyHours = workloads.length > 0 
        ? workloads.reduce((sum, w) => sum + w.weeklyHours, 0) / workloads.length 
        : 40;
      
      const avgOvertimeHours = workloads.length > 0 
        ? workloads.reduce((sum, w) => sum + w.overtimeHours, 0) / workloads.length 
        : 0;
      
      return {
        id: emp.employee_id,
        name: `${emp.prenom} ${emp.nom}`,
        department: emp.departement,
        weeklyHours: Math.round(avgWeeklyHours),
        overtimeHours: Math.round(avgOvertimeHours),
        absenceDaysRecent: totalAbsenceDays,
        performanceScore: 75
      };
      
    } catch (error) {
      console.error('Error in getEmployeeById:', error);
      return null;
    }
  }

  async getAllEmployeesWithWorkload() {
    try {
      const employees = await Employe.find({});
      const workloads = await Workload.find({});
      
      const workloadMap = new Map();
      workloads.forEach(w => {
        if (!workloadMap.has(w.employee_id)) {
          workloadMap.set(w.employee_id, { weeklyHours: [], overtimeHours: [] });
        }
        const data = workloadMap.get(w.employee_id);
        data.weeklyHours.push(w.weeklyHours);
        data.overtimeHours.push(w.overtimeHours);
      });
      
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      threeMonthsAgo.setHours(0, 0, 0, 0);
      
      const absences = await Absence.find({
        startDate: { $gte: threeMonthsAgo }
      });
      
      const absenceMap = new Map();
      absences.forEach(a => {
        const current = absenceMap.get(a.employee_id) || 0;
        absenceMap.set(a.employee_id, current + a.days);
      });
      
      return employees.map(emp => {
        const workload = workloadMap.get(emp.employee_id) || { weeklyHours: [40], overtimeHours: [0] };
        const avgWeeklyHours = workload.weeklyHours.reduce((a, b) => a + b, 0) / workload.weeklyHours.length;
        const avgOvertimeHours = workload.overtimeHours.reduce((a, b) => a + b, 0) / workload.overtimeHours.length;
        
        return {
          id: emp.employee_id,
          name: `${emp.prenom} ${emp.nom}`,
          department: emp.departement,
          weeklyHours: Math.round(avgWeeklyHours),
          overtimeHours: Math.round(avgOvertimeHours),
          absenceDaysRecent: absenceMap.get(emp.employee_id) || 0,
          performanceScore: 75
        };
      });
      
    } catch (error) {
      console.error('Error in getAllEmployeesWithWorkload:', error);
      return [];
    }
  }

  async getDepartmentAverages() {
    try {
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
        averages[dept] = deptCount.get(dept) ? total / deptCount.get(dept) : 40;
      }
      return averages;
      
    } catch (error) {
      console.error('Error in getDepartmentAverages:', error);
      return {};
    }
  }

  async getDepartmentTurnoverRisk() {
    try {
      const employees = await this.getAllEmployeesWithWorkload();
      const deptMap = new Map();
      
      employees.forEach(emp => {
        if (!deptMap.has(emp.department)) {
          deptMap.set(emp.department, { 
            employees: [], 
            totalWeekly: 0, 
            totalOvertime: 0, 
            totalAbsence: 0, 
            count: 0 
          });
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
        if (avgAbsence > 10) riskScore += 25;
        else if (avgAbsence > 5) riskScore += 10;
        
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
          employeesAtRisk: data.employees
            .filter(e => e.weeklyHours > 48 || e.overtimeHours > 15)
            .map(e => e.name)
        });
      }
      
      return results.sort((a, b) => b.riskScore - a.riskScore);
      
    } catch (error) {
      console.error('Error in getDepartmentTurnoverRisk:', error);
      return [];
    }
  }
}

module.exports = new AIDatabaseService();
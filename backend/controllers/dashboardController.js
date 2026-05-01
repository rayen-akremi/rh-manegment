const Employe = require('../models/Employe');
const Absence = require('../models/Absence');
const Workload = require('../models/Workload');
const TurnoverHistory = require('../models/TurnoverHistory');

const CALENDAR_DAYS_PER_MONTH = 30;

// ========== 1. GET KPI DATA ==========
exports.getKpi = async (req, res) => {
  try {
    const totalEmployees = await Employe.countDocuments();
    const absences = await Absence.aggregate([{ $group: { _id: null, totalDays: { $sum: "$days" } } }]);
    const totalAbsenceDays = absences[0]?.totalDays || 0;
    const workloads = await Workload.aggregate([{ $group: { _id: null, totalOvertime: { $sum: "$overtimeHours" } } }]);
    const overtimeHours = workloads[0]?.totalOvertime || 0;
    const lastTurnover = await TurnoverHistory.findOne().sort({ year: -1, month: -1 });
    
    let absenceRate = 0;
    if (totalEmployees > 0 && totalAbsenceDays > 0) {
      const totalPossibleDays = totalEmployees * CALENDAR_DAYS_PER_MONTH;
      absenceRate = parseFloat(((totalAbsenceDays / totalPossibleDays) * 100).toFixed(1));
    }
    
    res.json({
      absenceRate,
      turnoverRate: lastTurnover?.turnoverRate || 0,
      totalEmployees,
      overtimeHours
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== 2. GET MONTHLY DATA (DYNAMIC) ==========
exports.getMonthlyData = async (req, res) => {
  try {
    // Get the last 6 months of data dynamically from absences
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const totalEmployees = await Employe.countDocuments();
    
    const monthlyData = [];
    
    // Calculate for last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      
      // Get start and end dates for this month (current year)
      const year = currentDate.getFullYear();
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);
      
      // Calculate absence rate for this month
      const absencesThisMonth = await Absence.aggregate([
        { 
          $match: { 
            startDate: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: null, totalDays: { $sum: "$days" } } }
      ]);
      
      const totalAbsenceDaysThisMonth = absencesThisMonth[0]?.totalDays || 0;
      
      let absenceRate = 0;
      if (totalEmployees > 0 && totalAbsenceDaysThisMonth > 0) {
        const totalPossibleDays = totalEmployees * CALENDAR_DAYS_PER_MONTH;
        absenceRate = parseFloat(((totalAbsenceDaysThisMonth / totalPossibleDays) * 100).toFixed(1));
      }
      
      // Get turnover rate for this month (if you have turnover data)
      const turnoverData = await TurnoverHistory.findOne({ 
        month: monthName, 
        year: year 
      });
      
      const turnoverRate = turnoverData?.turnoverRate || 0;
      
      monthlyData.push({
        month: monthName,
        absence: absenceRate,
        turnover: turnoverRate
      });
    }
    
    res.json(monthlyData);
  } catch (error) {
    console.error('Monthly data error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 3. GET ABSENCE REASONS ==========
exports.getAbsenceReasons = async (req, res) => {
  try {
    const reasons = await Absence.aggregate([
      { $group: { _id: "$type", total: { $sum: "$days" } } },
      { $project: { name: "$_id", value: "$total", _id: 0 } }
    ]);
    
    const colors = { 
      'Sick leave': '#ef4444', 
      'Vacation': '#3b82f6', 
      'Maternity': '#10b981', 
      'Other': '#f59e0b'
    };
    
    const result = reasons.map(r => ({ 
      ...r, 
      color: colors[r.name] || '#6b7280'
    }));
    
    if (result.length === 0) {
      return res.json([]);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== 4. GET TOP ABSENCES ==========
exports.getTopAbsences = async (req, res) => {
  try {
    const top = await Absence.aggregate([
      { $group: { _id: "$employee_id", totalDays: { $sum: "$days" } } },
      { $sort: { totalDays: -1 } },
      { $limit: 5 },
      { $lookup: { from: "employes", localField: "_id", foreignField: "employee_id", as: "emp" } },
      { $unwind: { path: "$emp", preserveNullAndEmptyArrays: true } }
    ]);
    
    const result = top.map(item => ({
      name: item.emp ? `${item.emp.prenom} ${item.emp.nom}` : item._id,
      department: item.emp?.departement || 'N/A',
      days: item.totalDays
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== 5. GET TOP OVERTIME ==========
exports.getTopOvertime = async (req, res) => {
  try {
    const top = await Workload.aggregate([
      { $group: { _id: "$employee_id", totalOvertime: { $sum: "$overtimeHours" } } },
      { $sort: { totalOvertime: -1 } },
      { $limit: 5 },
      { $lookup: { from: "employes", localField: "_id", foreignField: "employee_id", as: "emp" } },
      { $unwind: { path: "$emp", preserveNullAndEmptyArrays: true } }
    ]);
    
    const result = top.map(item => ({
      name: item.emp ? `${item.emp.prenom} ${item.emp.nom}` : item._id,
      department: item.emp?.departement || 'N/A',
      hours: item.totalOvertime
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
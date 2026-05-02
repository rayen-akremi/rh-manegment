// backend/services/aiPredictionService.js
class LinearRegression {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.calculate();
  }

  calculate() {
    const n = this.x.length;
    const sumX = this.x.reduce((a, b) => a + b, 0);
    const sumY = this.y.reduce((a, b) => a + b, 0);
    const sumX2 = this.x.reduce((a, b) => a + b * b, 0);
    const sumXY = this.x.reduce((a, b, i) => a + b * this.y[i], 0);

    this.slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    this.intercept = (sumY - this.slope * sumX) / n;
  }

  predict(x) {
    return this.intercept + this.slope * x;
  }

  getTrend() {
    if (this.slope > 0.3) return 'increasing';
    if (this.slope < -0.3) return 'decreasing';
    return 'stable';
  }
}

class AIPredictionService {
  
  // Helper function to get days in month (for accurate rate calculation)
  getDaysInMonth(year, month) {
    // month is 0-indexed in JavaScript Date
    return new Date(year, month + 1, 0).getDate();
  }

  // Calculate absence rate based on actual days in month
  calculateAbsenceRate(absenceDays, year, month) {
    const daysInMonth = this.getDaysInMonth(year, month);
    return Math.min(100, Math.round((absenceDays / daysInMonth) * 100));
  }

  predictAbsence(monthlyAbsences, employeeName, employeeId) {
    if (!monthlyAbsences || monthlyAbsences.length < 3) {
      return {
        employeeId,
        employeeName,
        predictedAbsenceDays: 0,
        predictedAbsenceRate: 0,
        confidenceLow: 0,
        confidenceHigh: 0,
        trend: 'stable',
        error: 'Insufficient data (need at least 3 months of absence history)',
        historicalData: monthlyAbsences || []
      };
    }

    const last3Months = monthlyAbsences.slice(-3);
    const months = [1, 2, 3];
    const regression = new LinearRegression(months, last3Months);
    
    const prediction = regression.predict(4);
    const predictedDays = Math.max(0, Math.round(prediction * 10) / 10);
    
    // Use 30 days as standard month for rate calculation
    // (except February which is handled separately but for prediction we use average)
    const standardMonthDays = 30;
    const predictedRate = Math.min(100, Math.round((predictedDays / standardMonthDays) * 100));
    
    const confidenceMargin = predictedDays * 0.2;
    
    return {
      employeeId,
      employeeName,
      predictedAbsenceDays: predictedDays,
      predictedAbsenceRate: predictedRate,
      confidenceLow: Math.max(0, Math.round((predictedDays - confidenceMargin) * 10) / 10),
      confidenceHigh: Math.round((predictedDays + confidenceMargin) * 10) / 10,
      trend: regression.getTrend(),
      historicalData: last3Months,
      calculationNote: "Rate calculated based on 30 days per month (standard full month)"
    };
  }

  predictTurnoverRisk(weeklyHours, overtimeHours, absenceDaysRecent, performanceScore, department, avgDeptWeeklyHours = 40) {
    let riskScore = 0;
    const factors = [];
    
    if (weeklyHours > 55) {
      riskScore += 35;
      factors.push('Heures hebdomadaires critiques (>55h)');
    } else if (weeklyHours > 48) {
      riskScore += 25;
      factors.push('Heures hebdomadaires élevées (>48h)');
    } else if (weeklyHours > 45) {
      riskScore += 15;
      factors.push('Charge de travail élevée');
    }
    
    if (overtimeHours > 25) {
      riskScore += 30;
      factors.push('Heures supplémentaires excessives (>25h/semaine)');
    } else if (overtimeHours > 15) {
      riskScore += 20;
      factors.push('Heures supplémentaires importantes (>15h/semaine)');
    } else if (overtimeHours > 8) {
      riskScore += 10;
      factors.push('Heures supplémentaires modérées');
    }
    
    if (absenceDaysRecent > 10) {
      riskScore += 20;
      factors.push('Augmentation significative des absences');
    } else if (absenceDaysRecent > 5) {
      riskScore += 10;
      factors.push('Hausse des absences récentes');
    }
    
    if (performanceScore && performanceScore < 50) {
      riskScore += 15;
      factors.push('Performance en baisse');
    } else if (performanceScore && performanceScore < 70) {
      riskScore += 8;
      factors.push('Performance modérée');
    }
    
    if (weeklyHours > avgDeptWeeklyHours + 10) {
      riskScore += 10;
      factors.push('Charge supérieure à la moyenne du département');
    }
    
    riskScore = Math.min(100, riskScore);
    
    let riskLevel = 'Low';
    if (riskScore >= 70) riskLevel = 'Critical';
    else if (riskScore >= 50) riskLevel = 'High';
    else if (riskScore >= 30) riskLevel = 'Medium';
    
    let recommendation = '';
    if (riskLevel === 'Critical') {
      recommendation = 'Action immédiate : réduction de charge, entretien de rétention, suivi RH intensif';
    } else if (riskLevel === 'High') {
      recommendation = 'Plan d\'action : redistribution des tâches, flexibilité horaire, entretien préventif';
    } else if (riskLevel === 'Medium') {
      recommendation = 'Surveillance active : évaluation des sources de stress';
    } else {
      recommendation = 'Situation stable : entretien annuel planifié';
    }
    
    return { riskScore: Math.round(riskScore), riskLevel, mainFactors: factors, recommendation };
  }

  predictWorkloadOverload(weeklyHours, overtimeHours, taskComplexity = 5, teamSupport = 5) {
    let overloadScore = 0;
    let status = 'Normal';
    
    if (weeklyHours > 55) {
      overloadScore += 40;
      status = 'Critical';
    } else if (weeklyHours > 48) {
      overloadScore += 30;
      status = 'High';
    } else if (weeklyHours > 45) {
      overloadScore += 15;
      status = 'Medium';
    }
    
    if (overtimeHours > 25) {
      overloadScore += 35;
      if (status !== 'Critical') status = 'High';
    } else if (overtimeHours > 15) {
      overloadScore += 20;
      if (status === 'Normal') status = 'Medium';
    } else if (overtimeHours > 8) {
      overloadScore += 10;
    }
    
    overloadScore = Math.min(100, overloadScore);
    
    let recommendation = '';
    if (status === 'Critical') {
      recommendation = 'URGENT : Réduire immédiatement la charge de travail, déléguer des tâches';
    } else if (status === 'High') {
      recommendation = 'Évaluer la répartition des tâches, discuter des priorités';
    } else if (status === 'Medium') {
      recommendation = 'Surveiller l\'évolution, optimiser les processus';
    } else {
      recommendation = 'Charge de travail équilibrée';
    }
    
    return { overloadScore: Math.round(overloadScore), status, recommendation, weeklyHours, overtimeHours };
  }
}

module.exports = new AIPredictionService();
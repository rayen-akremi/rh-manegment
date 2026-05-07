# services/ai_predictor.py
import numpy as np
from sklearn.linear_model import LinearRegression

class HRPredictor:
    """
    HR AI Predictor - Machine Learning service for HR analytics
    """
    
    def __init__(self):
        self.name = "HR AI Predictor"
        self.version = "2.0"
    
    def predict_absence(self, historical_data, employee_name, employee_id):
        """Predict future absence days based on historical data"""
        if len(historical_data) < 3:
            return {
                "employeeId": employee_id,
                "employeeName": employee_name,
                "predictedAbsenceDays": 0,
                "predictedAbsenceRate": 0,
                "confidenceLow": 0,
                "confidenceHigh": 0,
                "trend": "stable",
                "error": "Insufficient data (need at least 3 months)",
                "historicalData": historical_data
            }
        
        last_3 = historical_data[-3:]
        X = np.array([1, 2, 3]).reshape(-1, 1)
        y = np.array(last_3)
        
        model = LinearRegression()
        model.fit(X, y)
        
        prediction = model.predict([[4]])[0]
        predicted_days = max(0, round(prediction, 1))
        
        predicted_rate = min(100, round((predicted_days / 30) * 100))
        
        confidence_margin = predicted_days * 0.2
        confidence_low = max(0, round(predicted_days - confidence_margin, 1))
        confidence_high = round(predicted_days + confidence_margin, 1)
        
        slope = model.coef_[0]
        if slope > 0.3:
            trend = "increasing"
        elif slope < -0.3:
            trend = "decreasing"
        else:
            trend = "stable"
        
        return {
            "employeeId": employee_id,
            "employeeName": employee_name,
            "predictedAbsenceDays": predicted_days,
            "predictedAbsenceRate": predicted_rate,
            "confidenceLow": confidence_low,
            "confidenceHigh": confidence_high,
            "trend": trend,
            "historicalData": last_3
        }
    
    def predict_turnover_risk(self, weekly_hours, overtime_hours, absence_days_recent, 
                              performance_score, department, avg_dept_weekly=40,
                              turnover_context=None):
        """Predict employee turnover/resignation risk"""
        risk_score = 0
        factors = []
        
        if weekly_hours > 55:
            risk_score += 35
            factors.append("Heures hebdomadaires critiques (>55h)")
        elif weekly_hours > 48:
            risk_score += 25
            factors.append("Heures hebdomadaires élevées (>48h)")
        elif weekly_hours > 45:
            risk_score += 15
            factors.append("Charge de travail élevée")
        
        if overtime_hours > 25:
            risk_score += 30
            factors.append("Heures supplémentaires excessives (>25h/mois)")
        elif overtime_hours > 15:
            risk_score += 20
            factors.append("Heures supplémentaires importantes (>15h/mois)")
        elif overtime_hours > 8:
            risk_score += 10
            factors.append("Heures supplémentaires modérées")
        
        if absence_days_recent > 10:
            risk_score += 20
            factors.append("Augmentation significative des absences")
        elif absence_days_recent > 5:
            risk_score += 10
            factors.append("Hausse des absences récentes")
        
        if performance_score and performance_score < 50:
            risk_score += 15
            factors.append("Performance en baisse")
        elif performance_score and performance_score < 70:
            risk_score += 5
            factors.append("Performance modérée")
        
        if weekly_hours > avg_dept_weekly + 10:
            risk_score += 10
            factors.append("Charge supérieure à la moyenne du département")
        
        turnover_context = turnover_context or {}
        department_departures = turnover_context.get("departmentDepartureCount", 0)
        if department_departures >= 5:
            risk_score += 15
            factors.append(f"Historique de departs eleve dans le departement ({department_departures})")
        elif department_departures >= 2:
            risk_score += 8
            factors.append(f"Departs recents dans le departement ({department_departures})")

        top_reason = turnover_context.get("topDepartureReason")
        top_cause = turnover_context.get("topDepartureCause")
        if top_reason and top_reason not in ["-", "Unknown"]:
            factors.append(f"Motif dominant: {top_reason}")
        if top_cause and top_cause not in ["-", "Unknown"]:
            factors.append(f"Cause dominante: {top_cause}")

        risk_score = min(100, risk_score)
        
        if risk_score >= 70:
            risk_level = "Critical"
            recommendation = "Action immédiate : réduction de charge, entretien de rétention"
        elif risk_score >= 50:
            risk_level = "High"
            recommendation = "Plan d'action : redistribution des tâches, flexibilité horaire"
        elif risk_score >= 30:
            risk_level = "Medium"
            recommendation = "Surveillance active : évaluation des sources de stress"
        else:
            risk_level = "Low"
            recommendation = "Situation stable : entretien annuel planifié"
        
        return {
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "mainFactors": factors[:4],
            "recommendation": recommendation,
            "turnoverContext": turnover_context
        }
    
    def predict_workload_overload(self, weekly_hours, overtime_hours):
        """Predict workload overload risk"""
        overload_score = 0
        
        if weekly_hours > 55:
            overload_score += 40
            status = "Critical"
        elif weekly_hours > 48:
            overload_score += 30
            status = "High"
        elif weekly_hours > 45:
            overload_score += 15
            status = "Medium"
        else:
            status = "Normal"
        
        if overtime_hours > 25:
            overload_score += 35
            if status != "Critical":
                status = "High"
        elif overtime_hours > 15:
            overload_score += 20
            if status == "Normal":
                status = "Medium"
        elif overtime_hours > 8:
            overload_score += 10
        
        overload_score = min(100, overload_score)
        
        if status == "Critical":
            recommendation = "URGENT : Réduire immédiatement la charge de travail"
        elif status == "High":
            recommendation = "Évaluer la répartition des tâches, discuter des priorités"
        elif status == "Medium":
            recommendation = "Surveiller l'évolution, optimiser les processus"
        else:
            recommendation = "Charge de travail équilibrée"
        
        return {
            "overloadScore": overload_score,
            "status": status,
            "recommendation": recommendation,
            "weeklyHours": weekly_hours,
            "overtimeHours": overtime_hours
        }
    
    def get_batch_predictions(self, employees_data, dept_averages):
        """Generate predictions for multiple employees"""
        results = {
            "absences": [],
            "turnover": [],
            "workload": [],
            "summary": {
                "highRiskTurnover": 0,
                "criticalWorkload": 0,
                "totalEmployees": len(employees_data)
            }
        }
        
        for emp in employees_data:
            if emp.get("absenceHistory") and len(emp["absenceHistory"]) >= 3:
                absence_pred = self.predict_absence(
                    emp["absenceHistory"], 
                    emp["name"], 
                    emp["id"]
                )
                results["absences"].append(absence_pred)
            
            avg_dept = dept_averages.get(emp["department"], 40)
            turnover_pred = self.predict_turnover_risk(
                emp.get("weeklyHours", 40),
                emp.get("overtimeHours", 0),
                emp.get("absenceDaysRecent", 0),
                emp.get("performanceScore", 75),
                emp["department"],
                avg_dept,
                emp.get("turnoverContext")
            )
            results["turnover"].append({
                "employeeId": emp["id"],
                "employeeName": emp["name"],
                "department": emp["department"],
                **turnover_pred
            })
            
            if turnover_pred["riskLevel"] in ["High", "Critical"]:
                results["summary"]["highRiskTurnover"] += 1
            
            workload_pred = self.predict_workload_overload(
                emp.get("weeklyHours", 40),
                emp.get("overtimeHours", 0)
            )
            results["workload"].append({
                "employeeId": emp["id"],
                "employeeName": emp["name"],
                **workload_pred
            })
            
            if workload_pred["status"] == "Critical":
                results["summary"]["criticalWorkload"] += 1
        
        return results

hr_predictor = HRPredictor()

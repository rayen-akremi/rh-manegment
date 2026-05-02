# app.py - Complete version with all endpoints
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import pymongo
import numpy as np

load_dotenv()

app = Flask(__name__)
CORS(app)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "RH_management")

client = pymongo.MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

def get_employee_by_id(employee_id):
    """Get employee details"""
    try:
        emp = db.employes.find_one({"employee_id": employee_id})
        if not emp:
            return None
        
        workloads = list(db.workloads.find({"employee_id": employee_id}))
        if workloads:
            weekly_hours = sum(w.get("weeklyHours", 40) for w in workloads) / len(workloads)
            overtime_hours = sum(w.get("overtimeHours", 0) for w in workloads) / len(workloads)
        else:
            weekly_hours = 40
            overtime_hours = 0
        
        three_months_ago = datetime.now() - timedelta(days=90)
        recent_absences = list(db.absences.find({
            "employee_id": employee_id,
            "startDate": {"$gte": three_months_ago}
        }))
        absence_days = sum(a.get("days", 0) for a in recent_absences)
        
        return {
            "id": emp["employee_id"],
            "name": f"{emp.get('prenom', '')} {emp.get('nom', '')}".strip(),
            "department": emp.get("departement", "Unknown"),
            "weeklyHours": round(weekly_hours),
            "overtimeHours": round(overtime_hours),
            "absenceDaysRecent": absence_days,
            "performanceScore": 75
        }
    except Exception as e:
        print(f"Error: {e}")
        return None

def get_employee_absence_history(employee_id):
    """Get chronological monthly absence values"""
    try:
        absences = list(db.absences.find({"employee_id": employee_id}).sort("startDate", 1))
        if not absences:
            return []
        
        monthly = {}
        for a in absences:
            date = a["startDate"]
            key = f"{date.year}-{date.month:02d}"
            monthly[key] = monthly.get(key, 0) + a["days"]
        
        sorted_months = sorted(monthly.keys())
        return [monthly[m] for m in sorted_months]
        
    except Exception as e:
        print(f"Error: {e}")
        return []

def get_all_employees():
    """Get list of all employees"""
    try:
        employees = list(db.employes.find({}))
        return [{
            "id": e["employee_id"],
            "name": f"{e.get('prenom', '')} {e.get('nom', '')}".strip(),
            "department": e.get("departement", "Unknown")
        } for e in employees]
    except Exception as e:
        print(f"Error: {e}")
        return []

def predict_absence_value(monthly_values):
    """Predict next month's absence using linear regression"""
    if len(monthly_values) < 3:
        return 0, 0, "stable"
    
    last_3 = monthly_values[-3:]
    x = np.array([1, 2, 3])
    y = np.array(last_3)
    
    n = len(x)
    sum_x = np.sum(x)
    sum_y = np.sum(y)
    sum_xy = np.sum(x * y)
    sum_x2 = np.sum(x * x)
    
    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x) if (n * sum_x2 - sum_x * sum_x) != 0 else 0
    intercept = (sum_y - slope * sum_x) / n if n != 0 else 0
    
    prediction = intercept + slope * 4
    predicted_days = max(0, round(prediction, 1))
    
    if slope > 0.3:
        trend = "increasing"
    elif slope < -0.3:
        trend = "decreasing"
    else:
        trend = "stable"
    
    return predicted_days, trend, last_3

def predict_turnover_risk_value(weekly_hours, overtime_hours, absence_days):
    """Calculate turnover risk score"""
    risk_score = 0
    factors = []
    
    if weekly_hours > 48:
        risk_score += 25
        factors.append("Heures hebdomadaires élevées (>48h)")
    if overtime_hours > 15:
        risk_score += 20
        factors.append("Heures supplémentaires importantes (>15h/semaine)")
    if absence_days > 5:
        risk_score += 10
        factors.append("Hausse des absences récentes")
    
    risk_score = min(100, risk_score)
    
    if risk_score >= 50:
        risk_level = "High"
        recommendation = "Plan d'action : redistribution des tâches, flexibilité horaire"
    elif risk_score >= 30:
        risk_level = "Medium"
        recommendation = "Surveillance active : évaluation des sources de stress"
    else:
        risk_level = "Low"
        recommendation = "Situation stable : entretien annuel planifié"
    
    return risk_score, risk_level, factors, recommendation

def predict_workload_value(weekly_hours):
    """Calculate workload overload score"""
    if weekly_hours > 48:
        return 65, "High", "Évaluer la répartition des tâches, discuter des priorités"
    elif weekly_hours > 45:
        return 40, "Medium", "Surveiller l'évolution, optimiser les processus"
    else:
        return 20, "Normal", "Charge de travail équilibrée"

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "HR AI Predictor"})

@app.route('/debug/<employee_id>', methods=['GET'])
def debug(employee_id):
    monthly_values = get_employee_absence_history(employee_id)
    return jsonify({
        "employee_id": employee_id,
        "monthly_values": monthly_values,
        "total_months": len(monthly_values)
    })

@app.route('/predict/absence/<employee_id>', methods=['POST'])
def predict_absence(employee_id):
    try:
        emp = db.employes.find_one({"employee_id": employee_id})
        if not emp:
            return jsonify({"error": "Employee not found"}), 404
        
        name = f"{emp.get('prenom', '')} {emp.get('nom', '')}".strip()
        monthly_values = get_employee_absence_history(employee_id)
        
        if len(monthly_values) < 3:
            return jsonify({
                "employeeId": employee_id,
                "employeeName": name,
                "error": f"Insufficient data. Found {len(monthly_values)} months",
                "historicalData": monthly_values,
                "predictedAbsenceDays": 0
            })
        
        predicted_days, trend, last_3 = predict_absence_value(monthly_values)
        predicted_rate = min(100, round((predicted_days / 30) * 100))
        confidence_margin = predicted_days * 0.2
        confidence_low = max(0, round(predicted_days - confidence_margin, 1))
        confidence_high = round(predicted_days + confidence_margin, 1)
        
        return jsonify({
            "employeeId": employee_id,
            "employeeName": name,
            "predictedAbsenceDays": predicted_days,
            "predictedAbsenceRate": predicted_rate,
            "confidenceLow": confidence_low,
            "confidenceHigh": confidence_high,
            "trend": trend,
            "historicalData": last_3,
            "allMonthlyData": monthly_values
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict/turnover/<employee_id>', methods=['POST'])
def predict_turnover(employee_id):
    try:
        emp = db.employes.find_one({"employee_id": employee_id})
        if not emp:
            return jsonify({"error": "Employee not found"}), 404
        
        name = f"{emp.get('prenom', '')} {emp.get('nom', '')}".strip()
        department = emp.get("departement", "Unknown")
        
        workloads = list(db.workloads.find({"employee_id": employee_id}))
        weekly_hours = sum(w.get("weeklyHours", 40) for w in workloads) / len(workloads) if workloads else 40
        overtime_hours = sum(w.get("overtimeHours", 0) for w in workloads) / len(workloads) if workloads else 0
        
        three_months_ago = datetime.now() - timedelta(days=90)
        recent_absences = list(db.absences.find({
            "employee_id": employee_id,
            "startDate": {"$gte": three_months_ago}
        }))
        absence_days = sum(a.get("days", 0) for a in recent_absences)
        
        risk_score, risk_level, factors, recommendation = predict_turnover_risk_value(
            weekly_hours, overtime_hours, absence_days
        )
        
        return jsonify({
            "employeeId": employee_id,
            "employeeName": name,
            "department": department,
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "mainFactors": factors,
            "recommendation": recommendation,
            "weeklyHours": round(weekly_hours),
            "overtimeHours": round(overtime_hours),
            "absenceDaysRecent": absence_days
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict/workload/<employee_id>', methods=['POST'])
def predict_workload(employee_id):
    try:
        emp = db.employes.find_one({"employee_id": employee_id})
        if not emp:
            return jsonify({"error": "Employee not found"}), 404
        
        name = f"{emp.get('prenom', '')} {emp.get('nom', '')}".strip()
        
        workloads = list(db.workloads.find({"employee_id": employee_id}))
        weekly_hours = sum(w.get("weeklyHours", 40) for w in workloads) / len(workloads) if workloads else 40
        overtime_hours = sum(w.get("overtimeHours", 0) for w in workloads) / len(workloads) if workloads else 0
        
        overload_score, status, recommendation = predict_workload_value(weekly_hours)
        
        return jsonify({
            "employeeId": employee_id,
            "employeeName": name,
            "overloadScore": overload_score,
            "status": status,
            "recommendation": recommendation,
            "weeklyHours": round(weekly_hours),
            "overtimeHours": round(overtime_hours)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Batch predictions for all employees"""
    try:
        employees = get_all_employees()
        results = {
            "absences": [],
            "turnover": [],
            "workload": [],
            "summary": {
                "highRiskTurnover": 0,
                "criticalWorkload": 0,
                "totalEmployees": len(employees)
            }
        }
        
        for emp in employees:
            # Absence prediction
            monthly_values = get_employee_absence_history(emp["id"])
            if len(monthly_values) >= 3:
                predicted_days, trend, last_3 = predict_absence_value(monthly_values)
                predicted_rate = min(100, round((predicted_days / 30) * 100))
                results["absences"].append({
                    "employeeId": emp["id"],
                    "employeeName": emp["name"],
                    "predictedAbsenceDays": predicted_days,
                    "predictedAbsenceRate": predicted_rate,
                    "trend": trend,
                    "historicalData": last_3
                })
            
            # Get full employee data
            full_emp = get_employee_by_id(emp["id"])
            if full_emp:
                # Turnover prediction
                risk_score, risk_level, factors, recommendation = predict_turnover_risk_value(
                    full_emp["weeklyHours"],
                    full_emp["overtimeHours"],
                    full_emp["absenceDaysRecent"]
                )
                results["turnover"].append({
                    "employeeId": emp["id"],
                    "employeeName": emp["name"],
                    "department": full_emp["department"],
                    "riskScore": risk_score,
                    "riskLevel": risk_level,
                    "mainFactors": factors,
                    "recommendation": recommendation
                })
                if risk_level == "High":
                    results["summary"]["highRiskTurnover"] += 1
                
                # Workload prediction
                overload_score, status, recommendation = predict_workload_value(full_emp["weeklyHours"])
                results["workload"].append({
                    "employeeId": emp["id"],
                    "employeeName": emp["name"],
                    "overloadScore": overload_score,
                    "status": status,
                    "recommendation": recommendation
                })
                if status == "Critical":
                    results["summary"]["criticalWorkload"] += 1
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 HR AI Predictor Service Running")
    print("📍 http://localhost:5001")
    print("="*50 + "\n")
    app.run(host="0.0.0.0", port=5001, debug=True)
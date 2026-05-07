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

def get_recap_by_employee_id(employee_id):
    """Get imported monthly recap row by matricule."""
    try:
        return db.monthlyrecaps.find_one({"matricule": str(employee_id)})
    except Exception as e:
        print(f"Recap lookup error: {e}")
        return None

def get_recap_overtime_hours(recap):
    return (
        float(recap.get("overtime25", 0) or 0) +
        float(recap.get("overtime50", 0) or 0) +
        float(recap.get("overtime100", 0) or 0)
    )

def get_employee_by_id(employee_id):
    """Get employee details"""
    try:
        recap = get_recap_by_employee_id(employee_id)
        if recap:
            overtime_hours = get_recap_overtime_hours(recap)
            return {
                "id": recap.get("matricule"),
                "name": recap.get("employeeName", ""),
                "department": recap.get("department", "Unknown"),
                "weeklyHours": round(float(recap.get("htHours", 0) or 0), 1),
                "overtimeHours": round(overtime_hours, 1),
                "absenceDaysRecent": float(recap.get("absenceDays", 0) or 0),
                "absenceHoursRecent": float(recap.get("absenceHours", 0) or 0),
                "performanceScore": 75,
                "source": "monthlyRecap",
                "recap": {
                    "regime": recap.get("regime"),
                    "workforceType": recap.get("workforceType"),
                    "gender": recap.get("gender"),
                    "hireDate": recap.get("hireDate"),
                    "htHours": recap.get("htHours", 0),
                    "overtime25": recap.get("overtime25", 0),
                    "overtime50": recap.get("overtime50", 0),
                    "overtime100": recap.get("overtime100", 0),
                    "nightHours": recap.get("nightHours", 0),
                    "absenceDays": recap.get("absenceDays", 0),
                    "absenceHours": recap.get("absenceHours", 0)
                }
            }

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

def get_turnover_context(employee=None, department=None):
    """Read imported turnover departure fields and summarize them for risk scoring."""
    try:
        query = {}
        if department:
            query["department"] = department

        records = list(db.turnoverdepartures.find(query).sort("departureDate", -1).limit(200))
        if not records and department:
            records = list(db.turnoverdepartures.find({}).sort("departureDate", -1).limit(200))

        matched_departure = None
        if employee:
            employee_name = f"{employee.get('prenom', '')} {employee.get('nom', '')}".strip().lower()
            matched_departure = next(
                (r for r in records if str(r.get("employeeName", "")).strip().lower() == employee_name),
                None
            )

        def top_value(field):
            counts = {}
            for record in records:
                value = record.get(field) or "Unknown"
                counts[value] = counts.get(value, 0) + 1
            if not counts:
                return None, 0
            value, count = max(counts.items(), key=lambda item: item[1])
            return value, count

        top_reason, top_reason_count = top_value("departureReason")
        top_cause, top_cause_count = top_value("departureCause")
        top_workforce_type, _ = top_value("workforceType")
        top_college, _ = top_value("college")
        top_organization_type, _ = top_value("organizationType")

        return {
            "departmentDepartureCount": len(records),
            "topDepartureReason": top_reason,
            "topDepartureReasonCount": top_reason_count,
            "topDepartureCause": top_cause,
            "topDepartureCauseCount": top_cause_count,
            "topWorkforceType": top_workforce_type,
            "topCollege": top_college,
            "topOrganizationType": top_organization_type,
            "matchedDeparture": {
                "employeeName": matched_departure.get("employeeName"),
                "position": matched_departure.get("position"),
                "department": matched_departure.get("department"),
                "hireDate": matched_departure.get("hireDate"),
                "departureDate": matched_departure.get("departureDate"),
                "seniority": matched_departure.get("seniority"),
                "gender": matched_departure.get("gender"),
                "organizationType": matched_departure.get("organizationType"),
                "college": matched_departure.get("college"),
                "workforceType": matched_departure.get("workforceType"),
                "departureReason": matched_departure.get("departureReason"),
                "departureCause": matched_departure.get("departureCause"),
                "cumulative": matched_departure.get("cumulative")
            } if matched_departure else None
        }
    except Exception as e:
        print(f"Turnover context error: {e}")
        return {
            "departmentDepartureCount": 0,
            "topDepartureReason": None,
            "topDepartureReasonCount": 0,
            "topDepartureCause": None,
            "topDepartureCauseCount": 0,
            "topWorkforceType": None,
            "topCollege": None,
            "topOrganizationType": None,
            "matchedDeparture": None
        }

def get_employee_absence_history(employee_id):
    """Get chronological monthly absence values"""
    try:
        recap = get_recap_by_employee_id(employee_id)
        if recap:
            return [float(recap.get("absenceDays", 0) or 0)]

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
        recap_rows = list(db.monthlyrecaps.find({}).sort("importOrder", 1))
        if recap_rows:
            return [{
                "id": e.get("matricule"),
                "name": e.get("employeeName", ""),
                "department": e.get("department", "Unknown"),
                "source": "monthlyRecap"
            } for e in recap_rows]

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

def predict_turnover_risk_value(weekly_hours, overtime_hours, absence_days, turnover_context=None, source="workload"):
    """Calculate turnover risk score"""
    risk_score = 0
    factors = []
    
    if source == "monthlyRecap":
        if weekly_hours > 190:
            risk_score += 25
            factors.append("H. T mensuelles très élevées (>190h)")
        elif weekly_hours > 176:
            risk_score += 15
            factors.append("H. T mensuelles élevées (>176h)")
        if overtime_hours > 40:
            risk_score += 25
            factors.append("Heures majorées très importantes (>40h)")
        elif overtime_hours > 15:
            risk_score += 15
            factors.append("Heures majorées importantes (>15h)")
    else:
        if weekly_hours > 48:
            risk_score += 25
            factors.append("Heures hebdomadaires élevées (>48h)")
        if overtime_hours > 15:
            risk_score += 20
            factors.append("Heures supplémentaires importantes (>15h/semaine)")
    if absence_days > 5:
        risk_score += 10
        factors.append("Hausse des absences récentes")

    turnover_context = turnover_context or {}
    department_departures = turnover_context.get("departmentDepartureCount", 0)
    if department_departures >= 5:
        risk_score += 15
        factors.append(f"Historique de départs élevé dans le département ({department_departures})")
    elif department_departures >= 2:
        risk_score += 8
        factors.append(f"Départs récents dans le département ({department_departures})")

    top_reason = turnover_context.get("topDepartureReason")
    top_cause = turnover_context.get("topDepartureCause")
    if top_reason and top_reason not in ["-", "Unknown"]:
        factors.append(f"Motif dominant: {top_reason}")
    if top_cause and top_cause not in ["-", "Unknown"]:
        factors.append(f"Cause dominante: {top_cause}")
    
    risk_score = min(100, risk_score)
    
    if risk_score >= 50:
        risk_level = "High"
        recommendation = "Plan d'action : redistribution des tâches, flexibilité horaire, entretien de rétention ciblé"
    elif risk_score >= 30:
        risk_level = "Medium"
        recommendation = "Surveillance active : évaluation des sources de stress"
    else:
        risk_level = "Low"
        recommendation = "Situation stable : entretien annuel planifié"
    
    return risk_score, risk_level, factors, recommendation

def predict_workload_value(weekly_hours, overtime_hours=0, source="workload"):
    """Calculate workload overload score"""
    if source == "monthlyRecap":
        if weekly_hours > 190 or overtime_hours > 40:
            return 85, "Critical", "URGENT : volume mensuel ou heures supplémentaires très élevé"
        elif weekly_hours > 176 or overtime_hours > 20:
            return 65, "High", "Évaluer la répartition des tâches et les heures majorées"
        elif weekly_hours > 168 or overtime_hours > 8:
            return 40, "Medium", "Surveiller les heures majorées et H. NUIT"
        else:
            return 20, "Normal", "Charge mensuelle équilibrée"

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
        full_emp = get_employee_by_id(employee_id)
        if not full_emp:
            return jsonify({"error": "Employee not found"}), 404
        
        name = full_emp["name"]
        monthly_values = get_employee_absence_history(employee_id)
        if full_emp.get("source") == "monthlyRecap":
            absence_days = float(full_emp.get("absenceDaysRecent", 0) or 0)
            predicted_rate = min(100, round((absence_days / 30) * 100))
            return jsonify({
                "employeeId": employee_id,
                "employeeName": name,
                "predictedAbsenceDays": absence_days,
                "predictedAbsenceRate": predicted_rate,
                "confidenceLow": max(0, round(absence_days * 0.8, 1)),
                "confidenceHigh": round(absence_days * 1.2, 1),
                "trend": "imported",
                "historicalData": monthly_values,
                "allMonthlyData": monthly_values,
                "absenceHours": full_emp.get("absenceHoursRecent", 0),
                "source": "monthlyRecap"
            })
        
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
        full_emp = get_employee_by_id(employee_id)
        if not full_emp:
            return jsonify({"error": "Employee not found"}), 404
        
        name = full_emp["name"]
        department = full_emp["department"]
        weekly_hours = full_emp["weeklyHours"]
        overtime_hours = full_emp["overtimeHours"]
        absence_days = full_emp["absenceDaysRecent"]
        name_parts = name.split(" ") if name else []
        turnover_context = get_turnover_context(
            {
                "prenom": name_parts[0] if name_parts else "",
                "nom": " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
            },
            department
        )
        
        risk_score, risk_level, factors, recommendation = predict_turnover_risk_value(
            weekly_hours, overtime_hours, absence_days, turnover_context, full_emp.get("source", "workload")
        )
        
        return jsonify({
            "employeeId": employee_id,
            "employeeName": name,
            "department": department,
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "mainFactors": factors,
            "recommendation": recommendation,
            "turnoverContext": turnover_context,
            "weeklyHours": round(weekly_hours),
            "overtimeHours": round(overtime_hours),
            "absenceDaysRecent": absence_days,
            "recap": full_emp.get("recap"),
            "source": full_emp.get("source", "legacy")
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict/workload/<employee_id>', methods=['POST'])
def predict_workload(employee_id):
    try:
        full_emp = get_employee_by_id(employee_id)
        if not full_emp:
            return jsonify({"error": "Employee not found"}), 404
        
        name = full_emp["name"]
        weekly_hours = full_emp["weeklyHours"]
        overtime_hours = full_emp["overtimeHours"]
        
        overload_score, status, recommendation = predict_workload_value(
            weekly_hours,
            overtime_hours,
            full_emp.get("source", "workload")
        )
        
        return jsonify({
            "employeeId": employee_id,
            "employeeName": name,
            "department": full_emp["department"],
            "overloadScore": overload_score,
            "status": status,
            "recommendation": recommendation,
            "weeklyHours": round(weekly_hours),
            "overtimeHours": round(overtime_hours),
            "recap": full_emp.get("recap"),
            "source": full_emp.get("source", "legacy")
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
            full_emp = get_employee_by_id(emp["id"])
            if full_emp and full_emp.get("source") == "monthlyRecap":
                absence_days = float(full_emp.get("absenceDaysRecent", 0) or 0)
                results["absences"].append({
                    "employeeId": emp["id"],
                    "employeeName": emp["name"],
                    "predictedAbsenceDays": absence_days,
                    "predictedAbsenceRate": min(100, round((absence_days / 30) * 100)),
                    "trend": "imported",
                    "historicalData": monthly_values,
                    "absenceHours": full_emp.get("absenceHoursRecent", 0),
                    "source": "monthlyRecap"
                })
            elif len(monthly_values) >= 3:
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
            if full_emp:
                # Turnover prediction
                name_parts = emp["name"].split(" ") if emp["name"] else []
                turnover_context = get_turnover_context(
                    {
                        "prenom": name_parts[0] if name_parts else "",
                        "nom": " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
                    },
                    full_emp["department"]
                )
                risk_score, risk_level, factors, recommendation = predict_turnover_risk_value(
                    full_emp["weeklyHours"],
                    full_emp["overtimeHours"],
                    full_emp["absenceDaysRecent"],
                    turnover_context,
                    full_emp.get("source", "workload")
                )
                results["turnover"].append({
                    "employeeId": emp["id"],
                    "employeeName": emp["name"],
                    "department": full_emp["department"],
                    "riskScore": risk_score,
                    "riskLevel": risk_level,
                    "mainFactors": factors,
                    "recommendation": recommendation,
                    "turnoverContext": turnover_context,
                    "source": full_emp.get("source", "legacy"),
                    "recap": full_emp.get("recap")
                })
                if risk_level == "High":
                    results["summary"]["highRiskTurnover"] += 1
                
                # Workload prediction
                overload_score, status, recommendation = predict_workload_value(
                    full_emp["weeklyHours"],
                    full_emp["overtimeHours"],
                    full_emp.get("source", "workload")
                )
                results["workload"].append({
                    "employeeId": emp["id"],
                    "employeeName": emp["name"],
                    "department": full_emp["department"],
                    "overloadScore": overload_score,
                    "status": status,
                    "recommendation": recommendation,
                    "weeklyHours": full_emp["weeklyHours"],
                    "overtimeHours": full_emp["overtimeHours"],
                    "source": full_emp.get("source", "legacy"),
                    "recap": full_emp.get("recap")
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

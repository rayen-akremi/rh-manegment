# services/database.py
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "RH_management")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

async def get_employee_by_id(employee_id: str):
    """Get employee details by ID"""
    recap = await db.monthlyrecaps.find_one({"matricule": str(employee_id)})
    if recap:
        return {
            "id": recap["matricule"],
            "name": recap.get("employeeName", ""),
            "department": recap.get("department", "Unknown"),
            "source": "monthlyRecap"
        }

    employee = await db.employes.find_one({"employee_id": employee_id})
    if not employee:
        return None
    return {
        "id": employee["employee_id"],
        "name": f"{employee.get('prenom', '')} {employee.get('nom', '')}",
        "department": employee.get("departement", "Unknown")
    }

async def get_employee_absence_history(employee_id: str, months: int = 6):
    """Get absence history grouped by month"""
    recap = await db.monthlyrecaps.find_one({"matricule": str(employee_id)})
    if recap:
        return [recap.get("absenceDays", 0)]

    cutoff_date = datetime.now() - timedelta(days=months * 30)
    
    absences = await db.absences.find({
        "employee_id": employee_id,
        "startDate": {"$gte": cutoff_date}
    }).to_list(length=100)
    
    if not absences:
        return []
    
    monthly_data = {}
    for absence in absences:
        date = absence["startDate"]
        month_key = f"{date.year}-{date.month}"
        monthly_data[month_key] = monthly_data.get(month_key, 0) + absence["days"]
    
    return list(monthly_data.values())

async def get_employee_workload(employee_id: str):
    """Get employee workload data"""
    recap = await db.monthlyrecaps.find_one({"matricule": str(employee_id)})
    if recap:
        overtime_hours = (
            recap.get("overtime25", 0) +
            recap.get("overtime50", 0) +
            recap.get("overtime100", 0)
        )
        return {
            "weekly_hours": round(recap.get("htHours", 0)),
            "overtime_hours": round(overtime_hours)
        }

    workloads = await db.workloads.find({"employee_id": employee_id}).to_list(length=100)
    
    if not workloads:
        return {"weekly_hours": 40, "overtime_hours": 0}
    
    avg_weekly = sum(w.get("weeklyHours", 40) for w in workloads) / len(workloads)
    avg_overtime = sum(w.get("overtimeHours", 0) for w in workloads) / len(workloads)
    
    return {
        "weekly_hours": round(avg_weekly),
        "overtime_hours": round(avg_overtime)
    }

async def get_recent_absences(employee_id: str):
    """Get total absence days in last 3 months"""
    recap = await db.monthlyrecaps.find_one({"matricule": str(employee_id)})
    if recap:
        return recap.get("absenceDays", 0)

    three_months_ago = datetime.now() - timedelta(days=90)
    absences = await db.absences.find({
        "employee_id": employee_id,
        "startDate": {"$gte": three_months_ago}
    }).to_list(length=100)
    
    return sum(a.get("days", 0) for a in absences)

async def get_department_average_weekly(employee_id: str):
    """Get average weekly hours for employee's department"""
    employee = await get_employee_by_id(employee_id)
    if not employee:
        return 40
    
    employees = await db.employes.find({"departement": employee["department"]}).to_list(length=100)
    emp_ids = [e["employee_id"] for e in employees]
    
    workloads = await db.workloads.find({"employee_id": {"$in": emp_ids}}).to_list(length=1000)
    
    if not workloads:
        return 40
    
    avg_weekly = sum(w.get("weeklyHours", 40) for w in workloads) / len(workloads)
    return round(avg_weekly)

async def get_all_employees():
    """Get list of all employees"""
    recap_rows = await db.monthlyrecaps.find({}).sort("importOrder", 1).to_list(length=5000)
    if recap_rows:
        return [{
            "id": e["matricule"],
            "name": e.get("employeeName", ""),
            "department": e.get("department", "Unknown"),
            "source": "monthlyRecap"
        } for e in recap_rows]

    employees = await db.employes.find({}).to_list(length=1000)
    return [{
        "id": e["employee_id"],
        "name": f"{e.get('prenom', '')} {e.get('nom', '')}",
        "department": e.get("departement", "Unknown")
    } for e in employees]

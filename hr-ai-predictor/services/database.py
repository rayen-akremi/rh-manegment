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
    employees = await db.employes.find({}).to_list(length=1000)
    return [{
        "id": e["employee_id"],
        "name": f"{e.get('prenom', '')} {e.get('nom', '')}",
        "department": e.get("departement", "Unknown")
    } for e in employees]
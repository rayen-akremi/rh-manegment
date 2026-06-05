const Employe = require('../models/Employe');
const Absence = require('../models/Absence');
const Workload = require('../models/Workload');
const MonthlyRecap = require('../models/MonthlyRecap'); // AJOUTÉ : pour gérer les employés importés
const TurnoverDeparture = require('../models/TurnoverDeparture');

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employe.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { employee_id, matricule, prenom, nom, email, age, departement, poste, status, joinDate, regime, workforceType, gender, htHours, overtime25, overtime50, overtime100, nightHours, absenceDays, absenceHours } = req.body;
    const existing = await Employe.findOne({ $or: [{ employee_id }, { email }] });
    if (existing) return res.status(400).json({ message: 'ID ou email déjà utilisé' });
    const newEmp = new Employe({ 
      employee_id, matricule, prenom, nom, email, age, departement, poste, status, joinDate,
      regime, workforceType, gender, htHours, overtime25, overtime50, overtime100, nightHours, absenceDays, absenceHours
    });
    await newEmp.save();
    res.status(201).json(newEmp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;
    delete updates.employee_id;
    const updated = await Employe.findOneAndUpdate({ employee_id: id }, { $set: updates }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Employé non trouvé' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ========== DELETE SINGLE EMPLOYEE (avec suppression des données liées) ==========
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Vérifier si l'employé existe
    const employee = await Employe.findOne({ employee_id: id });
    if (!employee) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }
    
    // 2. Supprimer toutes les absences liées à cet employé
    const absencesResult = await Absence.deleteMany({ employee_id: id });
    
    // 3. Supprimer toutes les charges de travail liées à cet employé
    const workloadsResult = await Workload.deleteMany({ employee_id: id });
    
    // 4. (Optionnel) Supprimer les enregistrements de turnover liés à cet employé
    const turnoverResult = await TurnoverDeparture.deleteMany({ employee_id: id });
    
    // 5. Supprimer l'employé lui-même
    const deleted = await Employe.findOneAndDelete({ employee_id: id });
    
    res.json({ 
      message: 'Employé et ses données associées supprimés avec succès',
      details: {
        employee: deleted.employee_id,
        absencesSupprimees: absencesResult.deletedCount || 0,
        workloadsSupprimees: workloadsResult.deletedCount || 0,
        turnoverSupprimees: turnoverResult.deletedCount || 0
      }
    });
    
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== DELETE MULTIPLE EMPLOYEES (UNIFIED - gère aussi les employés importés) ==========
exports.deleteMultipleEmployees = async (req, res) => {
  try {
    const { ids, recapIds } = req.body;
    
    let totalDeleted = 0;
    let absencesDeleted = 0;
    let workloadsDeleted = 0;
    let turnoverDeleted = 0;
    let recapDeleted = 0;
    const deletedIds = [];
    
    // 1. Supprimer les employés normaux (table employes)
    if (ids && Array.isArray(ids) && ids.length > 0) {
      for (const id of ids) {
        const employee = await Employe.findOne({ employee_id: id });
        if (employee) {
          const absences = await Absence.deleteMany({ employee_id: id });
          const workloads = await Workload.deleteMany({ employee_id: id });
          const turnover = await TurnoverDeparture.deleteMany({ employee_id: id });
          
          absencesDeleted += absences.deletedCount || 0;
          workloadsDeleted += workloads.deletedCount || 0;
          turnoverDeleted += turnover.deletedCount || 0;
          
          await Employe.findOneAndDelete({ employee_id: id });
          totalDeleted++;
          deletedIds.push(id);
        }
      }
    }
    
    // 2. Supprimer les employés importés (table monthlyrecaps)
    if (recapIds && Array.isArray(recapIds) && recapIds.length > 0) {
      const result = await MonthlyRecap.deleteMany({ matricule: { $in: recapIds } });
      recapDeleted = result.deletedCount || 0;
      totalDeleted += recapDeleted;
    }
    
    if (totalDeleted === 0) {
      return res.status(404).json({ message: 'Aucun employé trouvé à supprimer' });
    }
    
    res.json({
      message: `${totalDeleted} employé(s) supprimé(s) avec leurs données associées`,
      details: {
        totalDeleted,
        regularDeleted: ids?.length || 0,
        recapDeleted,
        absencesSupprimees: absencesDeleted,
        workloadsSupprimees: workloadsDeleted,
        turnoverSupprimees: turnoverDeleted,
        deletedIds
      }
    });
    
  } catch (error) {
    console.error('Erreur suppression bulk:', error);
    res.status(500).json({ message: error.message });
  }
};
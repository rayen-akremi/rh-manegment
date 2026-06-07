const Employe = require('../models/Employe');
const Absence = require('../models/Absence');
const Workload = require('../models/Workload');
const MonthlyRecap = require('../models/MonthlyRecap');
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
    
    let updated = await Employe.findOneAndUpdate({ employee_id: id }, { $set: updates }, { new: true });
    if (!updated && id.match(/^[0-9a-fA-F]{24}$/)) {
      updated = await Employe.findByIdAndUpdate(id, { $set: updates }, { new: true });
    }
    if (!updated) return res.status(404).json({ message: 'Employé non trouvé' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ========== DELETE SINGLE EMPLOYEE ==========
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 [DELETE SINGLE] ID reçu:', id);
    
    let employee = await Employe.findOne({ employee_id: id });
    let deleted = null;
    let usedId = id;
    
    if (!employee && id.match(/^[0-9a-fA-F]{24}$/)) {
      employee = await Employe.findById(id);
      if (employee) {
        usedId = employee.employee_id;
        const absencesResult = await Absence.deleteMany({ employee_id: usedId });
        const workloadsResult = await Workload.deleteMany({ employee_id: usedId });
        const turnoverResult = await TurnoverDeparture.deleteMany({ employee_id: usedId });
        deleted = await Employe.findByIdAndDelete(id);
        
        console.log(`✅ [DELETE SINGLE] Supprimé par _id: ${id}`);
        
        return res.json({ 
          success: true,
          message: 'Employé supprimé avec succès',
          details: {
            employee: usedId,
            absencesSupprimees: absencesResult.deletedCount || 0,
            workloadsSupprimees: workloadsResult.deletedCount || 0,
            turnoverSupprimees: turnoverResult.deletedCount || 0
          }
        });
      }
    }
    
    if (!employee) {
      console.log('❌ [DELETE SINGLE] Employé non trouvé:', id);
      return res.status(404).json({ message: 'Employé non trouvé' });
    }
    
    const absencesResult = await Absence.deleteMany({ employee_id: id });
    const workloadsResult = await Workload.deleteMany({ employee_id: id });
    const turnoverResult = await TurnoverDeparture.deleteMany({ employee_id: id });
    deleted = await Employe.findOneAndDelete({ employee_id: id });
    
    console.log(`✅ [DELETE SINGLE] Supprimé par employee_id: ${id}`);
    
    res.json({ 
      success: true,
      message: 'Employé supprimé avec succès',
      details: {
        employee: id,
        absencesSupprimees: absencesResult.deletedCount || 0,
        workloadsSupprimees: workloadsResult.deletedCount || 0,
        turnoverSupprimees: turnoverResult.deletedCount || 0
      }
    });
    
  } catch (error) {
    console.error('❌ [DELETE SINGLE] Erreur:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== DELETE MULTIPLE EMPLOYEES ==========
exports.deleteMultipleEmployees = async (req, res) => {
  try {
    const { ids, recapIds } = req.body;
    
    console.log('🔍 [BULK DELETE] IDs reçus (normaux):', ids);
    console.log('🔍 [BULK DELETE] IDs reçus (importés):', recapIds);
    
    let totalDeleted = 0;
    let absencesDeleted = 0;
    let workloadsDeleted = 0;
    let turnoverDeleted = 0;
    let recapDeleted = 0;
    const deletedIds = [];
    const notFoundIds = [];
    
    // 1. Supprimer les employés normaux (table employes)
    if (ids && Array.isArray(ids) && ids.length > 0) {
      console.log(`📊 [BULK DELETE] Traitement de ${ids.length} employé(s) normal(aux)...`);
      
      for (const id of ids) {
        let employee = await Employe.findOne({ employee_id: id });
        let deleted = null;
        
        if (!employee && id.match(/^[0-9a-fA-F]{24}$/)) {
          employee = await Employe.findById(id);
          if (employee) {
            const absences = await Absence.deleteMany({ employee_id: employee.employee_id });
            const workloads = await Workload.deleteMany({ employee_id: employee.employee_id });
            const turnover = await TurnoverDeparture.deleteMany({ employee_id: employee.employee_id });
            deleted = await Employe.findByIdAndDelete(id);
            
            if (deleted) {
              absencesDeleted += absences.deletedCount || 0;
              workloadsDeleted += workloads.deletedCount || 0;
              turnoverDeleted += turnover.deletedCount || 0;
              totalDeleted++;
              deletedIds.push(id);
              console.log(`  ✅ Supprimé par _id: ${id}`);
            } else {
              notFoundIds.push(id);
              console.log(`  ❌ Non trouvé: ${id}`);
            }
            continue;
          }
        }
        
        if (employee) {
          const absences = await Absence.deleteMany({ employee_id: id });
          const workloads = await Workload.deleteMany({ employee_id: id });
          const turnover = await TurnoverDeparture.deleteMany({ employee_id: id });
          
          absencesDeleted += absences.deletedCount || 0;
          workloadsDeleted += workloads.deletedCount || 0;
          turnoverDeleted += turnover.deletedCount || 0;
          
          deleted = await Employe.findOneAndDelete({ employee_id: id });
          totalDeleted++;
          deletedIds.push(id);
          console.log(`  ✅ Supprimé par employee_id: ${id}`);
        } else {
          notFoundIds.push(id);
          console.log(`  ❌ Non trouvé: ${id}`);
        }
      }
    }
    
    // 2. Supprimer les employés importés (table monthlyrecaps)
    if (recapIds && Array.isArray(recapIds) && recapIds.length > 0) {
      console.log(`📊 [BULK DELETE] Traitement de ${recapIds.length} employé(s) importé(s)...`);
      console.log(`  📝 Matricules à supprimer:`, recapIds);
      
      const result = await MonthlyRecap.deleteMany({ matricule: { $in: recapIds } });
      recapDeleted = result.deletedCount || 0;
      totalDeleted += recapDeleted;
      console.log(`  ✅ Supprimés (importés): ${recapDeleted} sur ${recapIds.length}`);
      
      if (recapDeleted < recapIds.length) {
        const found = await MonthlyRecap.find({ matricule: { $in: recapIds } });
        const foundMatricules = found.map(f => f.matricule);
        const missing = recapIds.filter(id => !foundMatricules.includes(id));
        console.log(`  ⚠️ Non trouvés (importés):`, missing);
      }
    }
    
    console.log(`📊 [BULK DELETE] Résultat final: ${totalDeleted} supprimé(s) au total`);
    
    if (totalDeleted === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Aucun employé trouvé à supprimer',
        notFoundIds 
      });
    }
    
    res.json({
      success: true,
      message: `${totalDeleted} employé(s) supprimé(s) avec leurs données associées`,
      details: {
        totalDeleted,
        regularDeleted: deletedIds.length,
        recapDeleted,
        notFoundIds,
        absencesSupprimees: absencesDeleted,
        workloadsSupprimees: workloadsDeleted,
        turnoverSupprimees: turnoverDeleted,
        deletedIds
      }
    });
    
  } catch (error) {
    console.error('❌ [BULK DELETE] Erreur:', error);
    res.status(500).json({ message: error.message });
  }
};
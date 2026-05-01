const Employe = require('../models/Employe');

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
    const { employee_id, matricule, prenom, nom, email, age, departement, poste, status, joinDate } = req.body;
    const existing = await Employe.findOne({ $or: [{ employee_id }, { email }] });
    if (existing) return res.status(400).json({ message: 'ID ou email déjà utilisé' });
    const newEmp = new Employe({ employee_id, matricule, prenom, nom, email, age, departement, poste, status, joinDate });
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

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Employe.findOneAndDelete({ employee_id: id });
    if (!deleted) return res.status(404).json({ message: 'Employé non trouvé' });
    res.json({ message: 'Employé supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
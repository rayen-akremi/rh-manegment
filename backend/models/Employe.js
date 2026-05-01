const mongoose = require('mongoose');

const employeSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, unique: true },
  matricule: { type: String, unique: true, sparse: true },
  prenom: { type: String, required: true },
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true, min: 16 },
  departement: { type: String, required: true },
  poste: { type: String, required: true },
  status: { type: String, enum: ['Actif', 'En congé', 'Absent'], default: 'Actif' },
  joinDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Employe', employeSchema);
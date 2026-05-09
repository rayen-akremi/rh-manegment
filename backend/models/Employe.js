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
  joinDate: { type: Date, default: Date.now },
  // Monthly recap fields
  regime: { type: String, default: '' },
  workforceType: { type: String, default: '' },
  gender: { type: String, default: '' },
  htHours: { type: Number, default: 0 },
  overtime25: { type: Number, default: 0 },
  overtime50: { type: Number, default: 0 },
  overtime100: { type: Number, default: 0 },
  nightHours: { type: Number, default: 0 },
  absenceDays: { type: Number, default: 0 },
  absenceHours: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Employe', employeSchema);
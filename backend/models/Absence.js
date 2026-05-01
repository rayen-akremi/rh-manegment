const mongoose = require('mongoose');

const absenceSchema = new mongoose.Schema({
  absence_id: { type: String, required: true, unique: true },
  employee_id: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  type: { type: String, enum: ['Sick leave', 'Vacation', 'Maternity', 'Other'], required: true },
  days: { type: Number, required: true, min: 0 },
  startDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Absence', absenceSchema);
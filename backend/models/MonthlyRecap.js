const mongoose = require('mongoose');

const monthlyRecapSchema = new mongoose.Schema({
  matricule: { type: String, required: true, trim: true },
  employeeName: { type: String, required: true, trim: true },
  regime: { type: String, trim: true },
  department: { type: String, trim: true },
  workforceType: { type: String, trim: true },
  gender: { type: String, trim: true },
  hireDate: { type: Date },
  htHours: { type: Number, default: 0 },
  overtime25: { type: Number, default: 0 },
  overtime50: { type: Number, default: 0 },
  overtime100: { type: Number, default: 0 },
  nightHours: { type: Number, default: 0 },
  absenceDays: { type: Number, default: 0 },
  absenceHours: { type: Number, default: 0 },
  sourceSheet: { type: String, trim: true },
  sourceRowNumber: { type: Number, default: 0 },
  importOrder: { type: Number, default: 0 }
}, { timestamps: true });

monthlyRecapSchema.index({ matricule: 1 }, { unique: true });
monthlyRecapSchema.index({ importOrder: 1, sourceRowNumber: 1 });

module.exports = mongoose.model('MonthlyRecap', monthlyRecapSchema);

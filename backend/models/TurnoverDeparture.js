const mongoose = require('mongoose');

const turnoverDepartureSchema = new mongoose.Schema({
  month: { type: Date },
  employeeName: { type: String, required: true, trim: true },
  position: { type: String, trim: true },
  department: { type: String, trim: true },
  hireDate: { type: Date },
  departureDate: { type: Date, required: true },
  seniority: { type: String, trim: true },
  gender: { type: String, trim: true },
  organizationType: { type: String, trim: true },
  college: { type: String, trim: true },
  workforceType: { type: String, trim: true },
  departureReason: { type: String, trim: true },
  departureCause: { type: String, trim: true },
  cumulative: { type: Number, default: 0 },
  sourceYear: { type: Number },
  sourceSheet: { type: String, trim: true },
  sourceSheetIndex: { type: Number, default: 0 },
  sourceRowNumber: { type: Number, default: 0 },
  importOrder: { type: Number, default: 0 }
}, { timestamps: true });

turnoverDepartureSchema.index({ employeeName: 1, departureDate: 1 }, { unique: true });
turnoverDepartureSchema.index({ department: 1, departureDate: -1 });
turnoverDepartureSchema.index({ departureReason: 1 });
turnoverDepartureSchema.index({ sourceSheetIndex: 1, sourceRowNumber: 1, importOrder: 1 });

module.exports = mongoose.model('TurnoverDeparture', turnoverDepartureSchema);

const mongoose = require('mongoose');

const turnoverHistorySchema = new mongoose.Schema({
  month: { type: String, enum: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'], required: true },
  year: { type: Number, required: true },
  turnoverRate: { type: Number, required: true, min: 0 },
  departures: { type: Number, default: 0 },
  hires: { type: Number, default: 0 }
}, { timestamps: true });

turnoverHistorySchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('TurnoverHistory', turnoverHistorySchema);
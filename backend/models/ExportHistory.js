const mongoose = require('mongoose');

const exportHistorySchema = new mongoose.Schema({
  filename: { type: String, required: true },
  type: { type: String, required: true },
  filters: { type: String },
  rows: { type: Number, required: true },
  format: { type: String, enum: ['xlsx', 'csv'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('ExportHistory', exportHistorySchema);
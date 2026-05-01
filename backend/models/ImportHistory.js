const mongoose = require('mongoose');

const importHistorySchema = new mongoose.Schema({
  filename: { type: String, required: true },
  type: { type: String, required: true },
  rows: { type: Number, required: true },
  status: { type: String, enum: ['Success', 'Partial', 'Failed'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('ImportHistory', importHistorySchema);
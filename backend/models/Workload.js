const mongoose = require('mongoose');

const workloadSchema = new mongoose.Schema({
  workload_id: { type: String, required: true, unique: true },
  employee_id: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  weeklyHours: { type: Number, required: true, min: 0, default: 40 },
  overtimeHours: { type: Number, required: true, min: 0, default: 0 },
  status: { type: String, enum: ['Normal', 'High', 'Critical'], default: 'Normal' }
}, { timestamps: true });

module.exports = mongoose.model('Workload', workloadSchema);
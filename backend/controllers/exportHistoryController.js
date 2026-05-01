const ExportHistory = require('../models/ExportHistory');

// Get all export history records
exports.getAllExports = async (req, res) => {
  try {
    const exports = await ExportHistory.find().sort({ createdAt: -1 });
    res.json(exports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get export history by type (Employees, Absences, Workloads)
exports.getExportsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const exports = await ExportHistory.find({ type }).sort({ createdAt: -1 });
    res.json(exports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single export record by ID
exports.getExportById = async (req, res) => {
  try {
    const exportRecord = await ExportHistory.findById(req.params.id);
    if (!exportRecord) return res.status(404).json({ message: 'Export record not found' });
    res.json(exportRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new export record (called automatically during export)
exports.createExportRecord = async (data) => {
  try {
    const newRecord = new ExportHistory(data);
    await newRecord.save();
    return newRecord;
  } catch (error) {
    console.error('Error saving export history:', error);
    return null;
  }
};

// Get export statistics
exports.getExportStats = async (req, res) => {
  try {
    const totalExports = await ExportHistory.countDocuments();
    const byFormat = await ExportHistory.aggregate([
      { $group: { _id: "$format", count: { $sum: 1 } } }
    ]);
    const byType = await ExportHistory.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    const lastExport = await ExportHistory.findOne().sort({ createdAt: -1 });
    res.json({ totalExports, byFormat, byType, lastExport });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an export record
exports.deleteExportRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ExportHistory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Export record not found' });
    res.json({ message: 'Export record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
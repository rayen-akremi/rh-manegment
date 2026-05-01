const ImportHistory = require('../models/ImportHistory');

// Get all import history records
exports.getAllImports = async (req, res) => {
  try {
    const imports = await ImportHistory.find().sort({ createdAt: -1 });
    res.json(imports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get import history by type (Employees, Absences, Workloads)
exports.getImportsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const imports = await ImportHistory.find({ type }).sort({ createdAt: -1 });
    res.json(imports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single import record by ID
exports.getImportById = async (req, res) => {
  try {
    const importRecord = await ImportHistory.findById(req.params.id);
    if (!importRecord) return res.status(404).json({ message: 'Import record not found' });
    res.json(importRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new import record (called automatically during import)
exports.createImportRecord = async (data) => {
  try {
    const newRecord = new ImportHistory(data);
    await newRecord.save();
    return newRecord;
  } catch (error) {
    console.error('Error saving import history:', error);
    return null;
  }
};

// Delete an import record
exports.deleteImportRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ImportHistory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Import record not found' });
    res.json({ message: 'Import record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
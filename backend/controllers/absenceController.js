const Absence = require('../models/Absence');

exports.getAllAbsences = async (req, res) => {
  try {
    const absences = await Absence.find().sort({ startDate: -1 });
    res.json(absences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAbsence = async (req, res) => {
  try {
    const newAbsence = new Absence(req.body);
    await newAbsence.save();
    res.status(201).json(newAbsence);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Absence.findOneAndUpdate({ absence_id: id }, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Absence non trouvée' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    await Absence.findOneAndDelete({ absence_id: id });
    res.json({ message: 'Absence supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
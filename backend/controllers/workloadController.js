const Workload = require('../models/Workload');

exports.getAllWorkloads = async (req, res) => {
  try {
    const workloads = await Workload.find().sort({ createdAt: -1 });
    res.json(workloads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWorkload = async (req, res) => {
  try {
    const newWorkload = new Workload(req.body);
    await newWorkload.save();
    res.status(201).json(newWorkload);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateWorkload = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Workload.findOneAndUpdate({ workload_id: id }, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Workload non trouvé' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteWorkload = async (req, res) => {
  try {
    const { id } = req.params;
    await Workload.findOneAndDelete({ workload_id: id });
    res.json({ message: 'Workload supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
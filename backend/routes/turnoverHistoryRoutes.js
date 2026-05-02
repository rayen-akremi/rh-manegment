// backend/routes/turnoverHistoryRoutes.js
const express = require('express');
const router = express.Router();
const TurnoverHistory = require('../models/TurnoverHistory');

// GET all turnover history
router.get('/', async (req, res) => {
  try {
    const history = await TurnoverHistory.find().sort({ year: 1, month: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new turnover history
router.post('/', async (req, res) => {
  try {
    const { month, year, turnoverRate, departures, hires } = req.body;
    
    const newRecord = new TurnoverHistory({
      month,
      year,
      turnoverRate,
      departures: departures || 0,
      hires: hires || 0
    });
    
    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET turnover history by year
router.get('/year/:year', async (req, res) => {
  try {
    const history = await TurnoverHistory.find({ year: parseInt(req.params.year) }).sort({ month: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE turnover history by id
router.delete('/:id', async (req, res) => {
  try {
    await TurnoverHistory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ========== IMPORT MODELS ==========
require('./models/Employe');
require('./models/Absence');
require('./models/Workload');
require('./models/TurnoverHistory');
require('./models/TurnoverDeparture');
require('./models/MonthlyRecap');
require('./models/ImportHistory');
require('./models/ExportHistory');

// ========== IMPORT ROUTES ==========
const employeRoutes = require('./routes/employeRoutes');
const absenceRoutes = require('./routes/absenceRoutes');
const workloadRoutes = require('./routes/workloadRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const importHistoryRoutes = require('./routes/importHistoryRoutes');
const exportHistoryRoutes = require('./routes/exportHistoryRoutes');
const aiRoutes = require('./routes/aiRoutes');
const turnoverHistoryRoutes = require('./routes/turnoverHistoryRoutes'); // ADD THIS
const monthlyRecapRoutes = require('./routes/monthlyRecapRoutes');

// ========== DATABASE CONNECTION ==========
mongoose.connect('mongodb://127.0.0.1:27017/RH_management')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ========== ROUTES ==========
app.use('/api/employees', employeRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/workloads', workloadRoutes);
app.use('/api/turnover-history', turnoverHistoryRoutes); // ADD THIS
app.use('/api/monthly-recap', monthlyRecapRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/import-history', importHistoryRoutes);
app.use('/api/export-history', exportHistoryRoutes);
app.use('/api/ai', aiRoutes);

// ========== TEST ROUTE ==========
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

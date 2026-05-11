// backend/routes/turnoverHistoryRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const TurnoverHistory = require('../models/TurnoverHistory');
const TurnoverDeparture = require('../models/TurnoverDeparture');
const ImportHistory = require('../models/ImportHistory');

const upload = multer({ storage: multer.memoryStorage() });

const HEADER_MAP = {
  'Mois': 'month',
  'Nom et Prénom': 'employeeName',
  'Nom et Prenom': 'employeeName',
  'Position': 'position',
  'Département': 'department',
  'Departement': 'department',
  "Date d'embauche": 'hireDate',
  'Date de départ': 'departureDate',
  'Date de depart': 'departureDate',
  'Ancienneté': 'seniority',
  'Anciennete': 'seniority',
  'Genre': 'gender',
  "Type d'organisation": 'organizationType',
  'Collège': 'college',
  'College': 'college',
  "Type d'effectif": 'workforceType',
  'Motif de départ': 'departureReason',
  'Motif de depart': 'departureReason',
  'Cause de départ': 'departureCause',
  'Cause de depart': 'departureCause',
  'Cumul': 'cumulative'
};

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

const normalizeHeader = (value) => String(value || '')
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, "'")
  .toLowerCase();

const getHeaderKey = (value) => {
  const header = String(value || '').trim();
  const normalized = normalizeHeader(header);
  const match = Object.entries(HEADER_MAP).find(([label]) => normalizeHeader(label) === normalized);
  return match?.[1] || null;
};

const parseExcelDate = (value) => {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    return new Date(EXCEL_EPOCH + Math.round(value) * 24 * 60 * 60 * 1000);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]) - 1;
      const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
      const parsedFrenchDate = new Date(Date.UTC(year, month, day));
      return Number.isNaN(parsedFrenchDate.getTime()) ? undefined : parsedFrenchDate;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const cleanString = (value) => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text === '' ? undefined : text;
};

const toDepartureDocument = (row, sourceSheet, orderInfo = {}) => {
  const doc = {
    month: parseExcelDate(row.month),
    employeeName: cleanString(row.employeeName),
    position: cleanString(row.position),
    department: cleanString(row.department),
    hireDate: parseExcelDate(row.hireDate),
    departureDate: parseExcelDate(row.departureDate),
    seniority: cleanString(row.seniority),
    gender: cleanString(row.gender),
    organizationType: cleanString(row.organizationType),
    college: cleanString(row.college),
    workforceType: cleanString(row.workforceType),
    departureReason: cleanString(row.departureReason),
    departureCause: cleanString(row.departureCause),
    cumulative: Number(row.cumulative) || 0,
    sourceSheet,
    sourceSheetIndex: orderInfo.sourceSheetIndex || 0,
    sourceRowNumber: orderInfo.sourceRowNumber || 0,
    importOrder: orderInfo.importOrder || 0
  };

  doc.sourceYear = doc.departureDate?.getFullYear() || doc.month?.getFullYear();
  return doc;
};

const buildMonthlySummary = async (year) => {
  const match = year ? { sourceYear: Number(year) } : {};
  const rows = await TurnoverDeparture.aggregate([
    { $match: match },
    {
      $group: {
        _id: { year: { $year: '$departureDate' }, month: { $month: '$departureDate' } },
        departures: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return rows.map((row) => ({
    year: row._id.year,
    month: labels[row._id.month - 1],
    departures: row.departures,
    turnoverRate: row.departures
  }));
};

const buildGroupSummary = async (field, year) => {
  const match = year ? { sourceYear: Number(year) } : {};
  return TurnoverDeparture.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, value: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $limit: 12 },
    { $project: { _id: 0, name: { $ifNull: ['$_id', 'Unknown'] }, value: 1 } }
  ]);
};

// GET all turnover history
router.get('/', async (req, res) => {
  try {
    const history = await TurnoverHistory.find().sort({ year: 1, month: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET detailed turnover departures using the spreadsheet top-field keys
router.get('/departures', async (req, res) => {
  try {
    const { year } = req.query;
    const filter = year ? { sourceYear: Number(year) } : {};
    const departures = await TurnoverDeparture.find(filter).sort({
      sourceSheetIndex: 1,
      sourceRowNumber: 1,
      importOrder: 1,
      createdAt: 1
    });
    res.json(departures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET dashboard-ready summaries based on detailed departures
router.get('/departures/summary', async (req, res) => {
  try {
    const { year } = req.query;
    const filter = year ? { sourceYear: Number(year) } : {};
    const [totalDepartures, monthly, byDepartment, byReason, byCause, byWorkforceType] = await Promise.all([
      TurnoverDeparture.countDocuments(filter),
      buildMonthlySummary(year),
      buildGroupSummary('department', year),
      buildGroupSummary('departureReason', year),
      buildGroupSummary('departureCause', year),
      buildGroupSummary('workforceType', year)
    ]);

    res.json({ totalDepartures, monthly, byDepartment, byReason, byCause, byWorkforceType });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import ODS/XLSX turnover file with headers:
// Mois, Nom et Prénom, Position, Département, Date d'embauche, Date de départ, etc.
router.post('/departures/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const docs = [];

    let importOrder = 0;

    workbook.SheetNames.forEach((sheetName, sourceSheetIndex) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
      const headerIndex = rows.findIndex((row) => {
        const mappedHeaders = row.map(getHeaderKey).filter(Boolean);
        return mappedHeaders.includes('employeeName') || mappedHeaders.length >= 4;
      });
      if (headerIndex === -1) return;

      const keys = rows[headerIndex].map(getHeaderKey);
      rows.slice(headerIndex + 1).forEach((row, rowOffset) => {
        const mapped = {};
        keys.forEach((key, index) => {
          if (key) mapped[key] = row[index];
        });

        importOrder += 1;
        const doc = toDepartureDocument(mapped, sheetName, {
          sourceSheetIndex,
          sourceRowNumber: headerIndex + rowOffset + 2,
          importOrder
        });
        if (doc.employeeName && doc.departureDate) docs.push(doc);
      });
    });

    let imported = 0;
    let skipped = 0;
    for (const doc of docs) {
      try {
        await TurnoverDeparture.updateOne(
          { employeeName: doc.employeeName, departureDate: doc.departureDate },
          { $set: doc },
          { upsert: true }
        );
        imported += 1;
      } catch (error) {
        skipped += 1;
      }
    }

    await ImportHistory.create({
      filename: req.file.originalname,
      type: 'Turnover',
      rows: imported,
      status: skipped > 0 ? 'Partial' : 'Success'
    });

    res.status(201).json({
      message: `Imported ${imported} turnover departure records`,
      imported,
      skipped,
      detectedRows: docs.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a single turnover departure manually with the same fields as the file
router.post('/departures', async (req, res) => {
  try {
    const lastRecord = await TurnoverDeparture.findOne().sort({ importOrder: -1 });
    const doc = toDepartureDocument(req.body, req.body.sourceSheet || 'Manual', {
      sourceSheetIndex: 9999,
      sourceRowNumber: (lastRecord?.sourceRowNumber || 0) + 1,
      importOrder: (lastRecord?.importOrder || 0) + 1
    });

    if (!doc.employeeName || !doc.departureDate) {
      return res.status(400).json({ message: 'Nom et Prénom and Date de départ are required' });
    }

    const created = await TurnoverDeparture.create(doc);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

// DELETE multiple turnover departures by ids (body: { ids: [...] })
router.delete('/departures', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await TurnoverDeparture.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} records deleted`, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE turnover departure by id
router.delete('/departures/:id', async (req, res) => {
  try {
    const result = await TurnoverDeparture.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Departure record not found' });
    }
    res.json({ message: 'Departure record deleted successfully' });
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

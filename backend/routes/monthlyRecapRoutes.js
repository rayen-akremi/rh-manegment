const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const MonthlyRecap = require('../models/MonthlyRecap');
const ImportHistory = require('../models/ImportHistory');
const Employe = require('../models/Employe');
const Absence = require('../models/Absence');
const Workload = require('../models/Workload');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const ABSENCE_HOURS_PER_DAY = 8;
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

const HEADER_MAP = {
  'Matricule': 'matricule',
  'Nom & Prénom': 'employeeName',
  'Nom & Prenom': 'employeeName',
  'Régime': 'regime',
  'Regime': 'regime',
  'Département (New)': 'department',
  'Departement (New)': 'department',
  "Type d'effectif": 'workforceType',
  'Genre': 'gender',
  "Date d'embauche": 'hireDate',
  'H. T': 'htHours',
  '25 %': 'overtime25',
  '50 %': 'overtime50',
  '100 %': 'overtime100',
  'H. NUIT': 'nightHours',
  'ABS./jour': 'absenceDays'
};

const normalizeHeader = (value) => String(value || '')
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, "'")
  .toLowerCase();

const getHeaderKey = (value) => {
  const normalized = normalizeHeader(value);
  const match = Object.entries(HEADER_MAP).find(([label]) => normalizeHeader(label) === normalized);
  return match?.[1] || null;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDate = (value) => {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    return new Date(EXCEL_EPOCH + Math.round(value) * 24 * 60 * 60 * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const cleanString = (value) => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
};

const toRecapDocument = (row, sourceSheet, orderInfo) => {
  const absenceDays = parseNumber(row.absenceDays);
  return {
    matricule: cleanString(row.matricule),
    employeeName: cleanString(row.employeeName),
    regime: cleanString(row.regime),
    department: cleanString(row.department),
    workforceType: cleanString(row.workforceType),
    gender: cleanString(row.gender),
    hireDate: parseDate(row.hireDate),
    htHours: parseNumber(row.htHours),
    overtime25: parseNumber(row.overtime25),
    overtime50: parseNumber(row.overtime50),
    overtime100: parseNumber(row.overtime100),
    nightHours: parseNumber(row.nightHours),
    absenceDays,
    absenceHours: absenceDays * ABSENCE_HOURS_PER_DAY,
    sourceSheet,
    sourceRowNumber: orderInfo.sourceRowNumber,
    importOrder: orderInfo.importOrder
  };
};

const buildSummary = async () => {
  const rows = await MonthlyRecap.find();
  const totalEmployees = rows.length;
  const sum = (field) => rows.reduce((total, row) => total + (row[field] || 0), 0);
  return {
    totalEmployees,
    htHours: sum('htHours'),
    overtime25: sum('overtime25'),
    overtime50: sum('overtime50'),
    overtime100: sum('overtime100'),
    nightHours: sum('nightHours'),
    absenceDays: sum('absenceDays'),
    absenceHours: sum('absenceHours')
  };
};

// Sync MonthlyRecap data to Employe, Absence, and Workload collections
const syncMonthlyRecapToCollections = async () => {
  try {
    const recaps = await MonthlyRecap.find();
    
    for (const recap of recaps) {
      // Generate employee_id from matricule
      const employee_id = recap.matricule || recap.employeeName?.replace(/\s+/g, '_') || `EMP_${Date.now()}`;
      
      // Create or update Employe record
      const [prenom = '', nom = ''] = (recap.employeeName || '').split(/\s+/, 2);
      
      await Employe.findOneAndUpdate(
        { employee_id },
        {
          employee_id,
          matricule: recap.matricule,
          prenom: prenom || recap.employeeName,
          nom: nom || '',
          email: `${recap.matricule || employee_id}@company.com`,
          age: 30,
          departement: recap.department || 'Unknown',
          poste: 'Employee',
          status: 'Actif',
          regime: recap.regime,
          workforceType: recap.workforceType,
          gender: recap.gender,
          htHours: recap.htHours || 40,
          overtime25: recap.overtime25 || 0,
          overtime50: recap.overtime50 || 0,
          overtime100: recap.overtime100 || 0,
          nightHours: recap.nightHours || 0,
          absenceDays: recap.absenceDays || 0,
          absenceHours: recap.absenceHours || 0
        },
        { upsert: true }
      );

      // Create Absence record if there are absence days
      if (recap.absenceDays > 0) {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        
        await Absence.findOneAndUpdate(
          { absence_id: `ABS_${employee_id}_${now.getTime()}` },
          {
            absence_id: `ABS_${employee_id}_${now.getTime()}`,
            employee_id,
            name: recap.employeeName,
            department: recap.department || 'Unknown',
            type: 'Other',
            days: recap.absenceDays,
            startDate
          },
          { upsert: true }
        );
      }

      // Create Workload record
      const totalOvertimeHours = (recap.overtime25 || 0) + (recap.overtime50 || 0) + (recap.overtime100 || 0);
      
      await Workload.findOneAndUpdate(
        { workload_id: `WORK_${employee_id}` },
        {
          workload_id: `WORK_${employee_id}`,
          employee_id,
          name: recap.employeeName,
          department: recap.department || 'Unknown',
          weeklyHours: recap.htHours || 40,
          overtimeHours: totalOvertimeHours,
          status: totalOvertimeHours > 20 ? 'Critical' : totalOvertimeHours > 10 ? 'High' : 'Normal'
        },
        { upsert: true }
      );
    }
    
    return { synced: recaps.length, message: 'Data synced successfully' };
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
};

router.get('/', async (req, res) => {
  try {
    const rows = await MonthlyRecap.find().sort({ importOrder: 1, sourceRowNumber: 1 });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    res.json(await buildSummary());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync endpoint to populate Employe, Absence, and Workload from MonthlyRecap
router.post('/sync', async (req, res) => {
  try {
    const result = await syncMonthlyRecapToCollections();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const docs = [];
    let importOrder = 0;

    workbook.SheetNames.forEach((sheetName) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
      const headerIndex = rows.findIndex((row) => {
        const mapped = row.map(getHeaderKey).filter(Boolean);
        return mapped.includes('matricule') && mapped.includes('employeeName');
      });
      if (headerIndex === -1) return;

      const keys = rows[headerIndex].map(getHeaderKey);
      rows.slice(headerIndex + 1).forEach((row, rowOffset) => {
        const mapped = {};
        keys.forEach((key, index) => {
          if (key) mapped[key] = row[index];
        });
        importOrder += 1;
        const doc = toRecapDocument(mapped, sheetName, {
          sourceRowNumber: headerIndex + rowOffset + 2,
          importOrder
        });
        if (doc.matricule && doc.employeeName) docs.push(doc);
      });
    });

    if (!docs.length) {
      return res.status(400).json({ message: 'No monthly recap rows found in this file' });
    }

    const uniqueDocs = Array.from(new Map(docs.map((doc) => [doc.matricule, doc])).values());

    await MonthlyRecap.deleteMany({});
    const inserted = await MonthlyRecap.insertMany(uniqueDocs, { ordered: false });
    const imported = inserted.length;

    await ImportHistory.create({
      filename: req.file.originalname,
      type: 'Monthly Recap',
      rows: imported,
      status: 'Success'
    });

    // Sync data to other collections
    await syncMonthlyRecapToCollections();

    res.status(201).json({
      message: `Imported ${imported} monthly recap records`,
      imported,
      detectedRows: docs.length,
      summary: await buildSummary()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:matricule', async (req, res) => {
  try {
    const { matricule } = req.params;
    const result = await MonthlyRecap.findOneAndDelete({ matricule });
    if (!result) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }
    res.json({ message: 'Employé supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/bulk/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'IDs manquants' });
    }
    const result = await MonthlyRecap.deleteMany({ matricule: { $in: ids } });
    res.json({ message: `${result.deletedCount} employé(s) supprimé(s)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

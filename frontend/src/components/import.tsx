import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import Navbar from './Navbar';
import '../style/import.css';

interface RawRow {
  [key: string]: any;
}

interface ColumnMapping {
  systemField: string;
  sourceColumn: string;
}

type DetectedFileType = 'turnover' | 'generic';

const systemFields = [
  'Employee ID', 'Name', 'Department', 'Position', 'Email',
  'Absence Days', 'Overtime Hours', 'Weekly Hours', 'Status'
];

const turnoverFields = [
  'Mois',
  'Nom et Prénom',
  'Position',
  'Département',
  "Date d'embauche",
  'Date de départ',
  'Ancienneté',
  'Genre',
  "Type d'organisation",
  'Collège',
  "Type d'effectif",
  'Motif de départ',
  'Cause de départ',
  'Cumul'
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'")
    .trim();

const formatPreviewValue = (value: any) => {
  if (value instanceof Date) return value.toLocaleDateString('fr-FR');
  return value ?? '';
};

const ImportFile: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dataPreview, setDataPreview] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [importType] = useState<'full' | 'incremental'>('full');
  const [schedule] = useState('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [detectedFileType, setDetectedFileType] = useState<DetectedFileType>('generic');
  const [detectedSheet, setDetectedSheet] = useState('');
  const [detectedRows, setDetectedRows] = useState(0);

  const mockHistory = [
    { id: 1, date: '2026-04-20', filename: 'employees_april.xlsx', status: 'Success', rows: 45 },
    { id: 2, date: '2026-04-15', filename: 'update_absences.csv', status: 'Partial', rows: 12 },
  ];

  const resetDetectedState = () => {
    setDetectedFileType('generic');
    setDetectedSheet('');
    setDetectedRows(0);
  };

  const detectHeaderRow = (rows: any[][]) => {
    const expected = turnoverFields.map(normalize);
    return rows.findIndex((row) => {
      const rowHeaders = row.map((cell) => normalize(String(cell || '')));
      const matches = expected.filter((field) => rowHeaders.includes(field)).length;
      return matches >= 4 || rowHeaders.includes(normalize('Nom et Prénom'));
    });
  };

  const rowsToObjects = (rows: any[][], headerIndex: number) => {
    const cols = rows[headerIndex].map((cell) => String(cell || '').trim()).filter(Boolean);
    const objects = rows.slice(headerIndex + 1)
      .map((row) => {
        const item: RawRow = {};
        cols.forEach((col, index) => {
          item[col] = row[index];
        });
        return item;
      })
      .filter((row) => Object.values(row).some((value) => value !== '' && value !== undefined && value !== null));

    return { cols, objects };
  };

  const autoMapColumns = (cols: string[], fileType: DetectedFileType) => {
    const newMapping: ColumnMapping[] = [];
    const fields = fileType === 'turnover' ? turnoverFields : systemFields;

    fields.forEach((systemField) => {
      const normalizedField = normalize(systemField);
      const matchedCol = cols.find((col) => {
        const normalizedCol = normalize(col);
        return normalizedCol.includes(normalizedField) || normalizedField.includes(normalizedCol);
      });
      newMapping.push({ systemField, sourceColumn: matchedCol || '' });
    });

    setMapping(newMapping);
  };

  const validateData = (rows: RawRow[]) => {
    const errors: string[] = [];
    rows.forEach((row, idx) => {
      const absenceDays = parseFloat(row['Absence Days'] || row['Absences'] || row['absence_days'] || '0');
      const overtime = parseFloat(row['Overtime Hours'] || row['Overtime'] || row['overtime_hours'] || '0');
      if (absenceDays < 0) errors.push(`Ligne ${idx + 2} : Absence négative (${absenceDays})`);
      if (overtime < 0) errors.push(`Ligne ${idx + 2} : Heures sup négatives (${overtime})`);
      if (absenceDays > 365) errors.push(`Ligne ${idx + 2} : Absence irréaliste (${absenceDays} jours)`);
      if (overtime > 100) errors.push(`Ligne ${idx + 2} : Heures sup excessives (${overtime}h)`);
    });
    setValidationErrors(errors);
  };

  const runAIChecks = (rows: RawRow[], cols: string[], fileType: DetectedFileType) => {
    const suggestions: string[] = [];

    if (fileType === 'turnover') {
      const missingTurnoverHeaders = turnoverFields.filter((field) =>
        !cols.some((col) => normalize(col) === normalize(field))
      );
      if (missingTurnoverHeaders.length) {
        suggestions.push(`Colonnes turnover manquantes : ${missingTurnoverHeaders.join(', ')}`);
      } else {
        suggestions.push('Format Turnover détecté : les lignes titre/vides ont été ignorées automatiquement.');
      }
      setAiSuggestions(suggestions);
      return;
    }

    const names = rows.map((r) => r['Name'] || r['name']).filter(Boolean);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    if (duplicates.length) suggestions.push(`Doublons possibles pour : ${[...new Set(duplicates)].join(', ')}`);

    const requiredFields = ['Name', 'Employee ID'];
    const missingInHeaders = requiredFields.filter((f) => !cols.some((h) => h.includes(f)));
    if (missingInHeaders.length) suggestions.push(`Colonnes obligatoires manquantes : ${missingInHeaders.join(', ')}`);

    rows.forEach((row, idx) => {
      const dept = row['Department'] || row['department'];
      if (dept && !['Engineering', 'Sales', 'Marketing', 'Finance', 'Product', 'Support', 'RH'].includes(dept)) {
        suggestions.push(`Ligne ${idx + 2}: Département "${dept}" non standard. Vérifiez l'orthographe.`);
      }
    });
    setAiSuggestions(suggestions);
  };

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    const turnoverRows: RawRow[] = [];
    let turnoverHeaders: string[] = [];
    const detectedSheets: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        defval: '',
        raw: false
      }) as any[][];
      const foundHeader = detectHeaderRow(sheetRows);
      if (foundHeader >= 0) {
        const { cols, objects } = rowsToObjects(sheetRows, foundHeader);
        if (!turnoverHeaders.length) turnoverHeaders = cols;
        turnoverRows.push(...objects);
        detectedSheets.push(sheetName);
      }
    }

    if (!turnoverRows.length) {
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (rows.length === 0) throw new Error('Le fichier Excel/ODS est vide.');
      const cols = Object.keys(rows[0]);
      setDetectedFileType('generic');
      setDetectedSheet(workbook.SheetNames[0]);
      setDetectedRows(rows.length);
      setHeaders(cols);
      setDataPreview(rows.slice(0, 10));
      autoMapColumns(cols, 'generic');
      validateData(rows);
      runAIChecks(rows, cols, 'generic');
      return;
    }

    setDetectedFileType('turnover');
    setDetectedSheet(detectedSheets.join(', '));
    setDetectedRows(turnoverRows.length);
    setHeaders(turnoverHeaders);
    setDataPreview(turnoverRows.slice(0, 10));
    autoMapColumns(turnoverHeaders, 'turnover');
    validateData(turnoverRows);
    runAIChecks(turnoverRows, turnoverHeaders, 'turnover');
  };

  const processFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'ods', 'csv'].includes(ext || '')) {
      setErrorMessages(['Format non supporté. Utilisez .ods, .xlsx, .xls ou .csv']);
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);
    setUploading(true);
    setErrorMessages([]);
    setValidationErrors([]);
    setAiSuggestions([]);
    resetDetectedState();

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result;
        if (ext === 'csv') {
          Papa.parse(content as string, {
            header: true,
            skipEmptyLines: true,
            complete: (results: Papa.ParseResult<RawRow>) => {
              const rows = results.data as RawRow[];
              if (rows.length === 0) {
                setErrorMessages(['Le fichier CSV est vide ou mal formaté.']);
                setUploading(false);
                return;
              }
              const cols = Object.keys(rows[0]);
              setDetectedFileType('generic');
              setDetectedRows(rows.length);
              setHeaders(cols);
              setDataPreview(rows.slice(0, 10));
              autoMapColumns(cols, 'generic');
              validateData(rows);
              runAIChecks(rows, cols, 'generic');
              setUploadProgress(100);
              setUploading(false);
            },
            error: (err: { message: string }) => {
              setErrorMessages([`Erreur CSV : ${err.message}`]);
              setUploading(false);
            }
          });
          return;
        }

        const workbook = XLSX.read(content, { type: 'array', cellDates: true });
        processWorkbook(workbook);
        setUploadProgress(100);
      } catch (err: any) {
        setErrorMessages([err.message || 'Erreur de lecture du fichier']);
      } finally {
        if (ext !== 'csv') setUploading(false);
      }
    };
    reader.onerror = () => {
      setErrorMessages(['Erreur de lecture du fichier']);
      setUploading(false);
    };
    if (ext === 'csv') reader.readAsText(selectedFile);
    else reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleMappingChange = (systemField: string, sourceColumn: string) => {
    setMapping(mapping.map((m) => m.systemField === systemField ? { ...m, sourceColumn } : m));
  };

  const startImport = async () => {
    if (!file) return;

    if (detectedFileType !== 'turnover') {
      alert(`Import ${importType} démarré avec mapping: ${mapping.map((m) => `${m.systemField}<-${m.sourceColumn}`).join(', ')}\nPlanification: ${schedule || 'immédiate'}`);
      setImportHistory([{ id: Date.now(), date: new Date().toISOString(), filename: file.name, status: 'Success', rows: dataPreview.length }, ...mockHistory]);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await fetch('/api/turnover-history/departures/import', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Import failed');

      setImportHistory([{
        id: Date.now(),
        date: new Date().toISOString(),
        filename: file.name,
        status: result.skipped > 0 ? 'Partial' : 'Success',
        rows: result.imported
      }, ...mockHistory]);
      alert(`${result.message}. Rows detected: ${result.detectedRows}. Skipped: ${result.skipped}.`);
    } catch (err: any) {
      setImportHistory([{ id: Date.now(), date: new Date().toISOString(), filename: file.name, status: 'Failed', rows: 0 }, ...mockHistory]);
      alert(`Erreur import turnover: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const cancelImport = () => {
    setFile(null);
    setDataPreview([]);
    setHeaders([]);
    setUploadProgress(0);
    setErrorMessages([]);
    setValidationErrors([]);
    setAiSuggestions([]);
    resetDetectedState();
  };

  const saveMappingTemplate = () => {
    localStorage.setItem('importMapping', JSON.stringify(mapping));
    alert('Template de mapping sauvegardé');
  };

  const loadMappingTemplate = () => {
    const saved = localStorage.getItem('importMapping');
    if (saved) setMapping(JSON.parse(saved));
  };

  return (
    <div>
      <Navbar />
      <div className="import-page">
        <div className="page-header">
          <h1>Import File</h1>
          <p>Upload employee, CSV, Excel, ODS, or turnover departure files for integration.</p>
        </div>

        <div className="upload-section" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          <div className="drag-drop-area">
            {!file ? (
              <>
                <div className="upload-icon">File</div>
                <p>Drag & drop your file here</p>
                <p>or</p>
                <label className="btn-browse">
                  Browse files
                  <input type="file" accept=".ods,.xlsx,.xls,.csv" onChange={handleFileSelect} hidden />
                </label>
                <p className="formats">Supported: ODS, Excel (.xlsx, .xls) or CSV</p>
              </>
            ) : (
              <div className="file-info">
                <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                {detectedSheet && <div>Sheet: {detectedSheet}</div>}
                <div>Detected type: {detectedFileType === 'turnover' ? 'Turnover departures' : 'Generic import'}</div>
                {detectedRows > 0 && <div>Rows detected: {detectedRows}</div>}
                {uploading && <progress value={uploadProgress} max="100" className="progress-bar" />}
              </div>
            )}
          </div>
        </div>

        {errorMessages.length > 0 && (
          <div className="error-box"><strong>Erreurs de fichier :</strong><ul>{errorMessages.map((err, i) => <li key={i}>{err}</li>)}</ul></div>
        )}
        {validationErrors.length > 0 && (
          <div className="warning-box"><strong>Validations :</strong><ul>{validationErrors.map((err, i) => <li key={i}>{err}</li>)}</ul></div>
        )}
        {aiSuggestions.length > 0 && (
          <div className="ai-box"><strong>IA Suggestions :</strong><ul>{aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
        )}

        {dataPreview.length > 0 && (
          <div className="preview-section">
            <h3>Preview (first 10 rows)</h3>
            <div className="table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    {headers.map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {dataPreview.map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => <td key={h}>{formatPreviewValue(row[h])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {headers.length > 0 && (
          <div className="mapping-section">
            <h3>Column Mapping</h3>
            <div className="mapping-controls">
              <button className="btn-secondary" onClick={loadMappingTemplate}>Load Template</button>
              <button className="btn-secondary" onClick={saveMappingTemplate}>Save Template</button>
            </div>
            <table className="mapping-table">
              <thead>
                <tr>
                  <th>System Field</th>
                  <th>Source Column</th>
                </tr>
              </thead>
              <tbody>
                {mapping.map((m, idx) => (
                  <tr key={idx}>
                    <td>{m.systemField}</td>
                    <td>
                      <select value={m.sourceColumn} onChange={(e) => handleMappingChange(m.systemField, e.target.value)}>
                        <option value="">(ignore)</option>
                        {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="action-buttons">
          <button className="btn-primary" onClick={startImport} disabled={!file || uploading}>Start Import</button>
          <button className="btn-danger" onClick={cancelImport}>Cancel Import</button>
          <button className="btn-info" onClick={() => setShowHistory(!showHistory)}>View Import History</button>
        </div>

        {showHistory && (
          <div className="history-section">
            <h3>Import History</h3>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Filename</th>
                  <th>Status</th>
                  <th>Rows</th>
                </tr>
              </thead>
              <tbody>
                {(importHistory.length ? importHistory : mockHistory).map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.filename}</td>
                    <td className={`status-${item.status.toLowerCase()}`}>{item.status}</td>
                    <td>{item.rows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportFile;

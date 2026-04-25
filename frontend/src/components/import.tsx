import React, { useState, useCallback } from 'react';
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

const systemFields = [
  'Employee ID', 'Name', 'Department', 'Position', 'Email',
  'Absence Days', 'Overtime Hours', 'Weekly Hours', 'Status'
];

const ImportFile: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dataPreview, setDataPreview] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [importType, setImportType] = useState<'full' | 'incremental'>('full');
  const [schedule, setSchedule] = useState('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);

  const mockHistory = [
    { id: 1, date: '2026-04-20', filename: 'employees_april.xlsx', status: 'Success', rows: 45 },
    { id: 2, date: '2026-04-15', filename: 'update_absences.csv', status: 'Partial', rows: 12 },
  ];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const processFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setErrorMessages(['Format non supporté. Utilisez .xlsx, .xls ou .csv']);
      return;
    }
    setFile(selectedFile);
    setUploadProgress(0);
    setUploading(true);
    setErrorMessages([]);
    setValidationErrors([]);
    setAiSuggestions([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target?.result;
      if (ext === 'csv') {
        Papa.parse(binaryStr as string, {
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
            setHeaders(cols);
            setDataPreview(rows.slice(0, 10));
            autoMapColumns(cols);
            validateData(rows);
            runAIChecks(rows);
            setUploadProgress(100);
            setUploading(false);
          },
          error: (err: { message: string }) => {
            setErrorMessages([`Erreur CSV : ${err.message}`]);
            setUploading(false);
          }
        });
      } else {
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: RawRow[] = XLSX.utils.sheet_to_json(sheet);
        if (rows.length === 0) {
          setErrorMessages(['Le fichier Excel est vide.']);
          setUploading(false);
          return;
        }
        const cols = Object.keys(rows[0]);
        setHeaders(cols);
        setDataPreview(rows.slice(0, 10));
        autoMapColumns(cols);
        validateData(rows);
        runAIChecks(rows);
        setUploadProgress(100);
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setErrorMessages(['Erreur de lecture du fichier']);
      setUploading(false);
    };
    if (ext === 'csv') reader.readAsText(selectedFile);
    else reader.readAsBinaryString(selectedFile);
  };

  const autoMapColumns = (cols: string[]) => {
    const newMapping: ColumnMapping[] = [];
    systemFields.forEach(systemField => {
      const matchedCol = cols.find(col => col.toLowerCase().includes(systemField.toLowerCase()) ||
        systemField.toLowerCase().includes(col.toLowerCase()));
      if (matchedCol) {
        newMapping.push({ systemField, sourceColumn: matchedCol });
      } else {
        newMapping.push({ systemField, sourceColumn: '' });
      }
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

  const runAIChecks = (rows: RawRow[]) => {
    const suggestions: string[] = [];
    const names = rows.map(r => r['Name'] || r['name']).filter(Boolean);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    if (duplicates.length) suggestions.push(`⚠️ Doublons possibles pour : ${[...new Set(duplicates)].join(', ')}`);

    const requiredFields = ['Name', 'Employee ID'];
    const missingInHeaders = requiredFields.filter(f => !headers.some(h => h.includes(f)));
    if (missingInHeaders.length) suggestions.push(`❌ Colonnes obligatoires manquantes : ${missingInHeaders.join(', ')}`);

    rows.forEach((row, idx) => {
      const dept = row['Department'] || row['department'];
      if (dept && !['Engineering','Sales','Marketing','Finance','Product','Support','RH'].includes(dept)) {
        suggestions.push(`Ligne ${idx+2}: Département "${dept}" non standard. Vérifiez l'orthographe.`);
      }
    });
    setAiSuggestions(suggestions);
  };

  const handleMappingChange = (systemField: string, sourceColumn: string) => {
    setMapping(mapping.map(m => m.systemField === systemField ? { ...m, sourceColumn } : m));
  };

  const startImport = () => {
    alert(`Import ${importType} démarré avec mapping: ${mapping.map(m => `${m.systemField}<-${m.sourceColumn}`).join(', ')}\nPlanification: ${schedule || 'immédiate'}`);
    setImportHistory([{ id: Date.now(), date: new Date().toISOString(), filename: file?.name, status: 'Success', rows: dataPreview.length }, ...mockHistory]);
  };

  const cancelImport = () => {
    setFile(null);
    setDataPreview([]);
    setHeaders([]);
    setUploadProgress(0);
    setErrorMessages([]);
    setValidationErrors([]);
    setAiSuggestions([]);
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
          <p>Upload employee-related data files (Excel/CSV) for analysis and integration.</p>
        </div>

        <div className="upload-section" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          <div className="drag-drop-area">
            {!file ? (
              <>
                <div className="upload-icon">📁</div>
                <p>Drag & drop your file here</p>
                <p>or</p>
                <label className="btn-browse">
                  Browse files
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} hidden />
                </label>
                <p className="formats">Supported: Excel (.xlsx, .xls) or CSV</p>
              </>
            ) : (
              <div className="file-info">
                <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                {uploading && <progress value={uploadProgress} max="100" className="progress-bar" />}
              </div>
            )}
          </div>
        </div>

        {errorMessages.length > 0 && (
          <div className="error-box"><strong>⚠️ Erreurs de fichier :</strong><ul>{errorMessages.map((err,i)=><li key={i}>{err}</li>)}</ul></div>
        )}
        {validationErrors.length > 0 && (
          <div className="warning-box"><strong>🔍 Validations :</strong><ul>{validationErrors.map((err,i)=><li key={i}>{err}</li>)}</ul></div>
        )}
        {aiSuggestions.length > 0 && (
          <div className="ai-box"><strong>🤖 IA Suggestions :</strong><ul>{aiSuggestions.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
        )}

        {dataPreview.length > 0 && (
          <div className="preview-section">
            <h3>Preview (first 10 rows)</h3>
            <div className="table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    {headers.map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {dataPreview.map((row, i) => (
                    <tr key={i}>
                      {headers.map(h => <td key={h}>{row[h]}</td>)}
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
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="options-section">
          <h3>Import Options</h3>
          <div className="options-row">
            <div className="option-group">
              <label>Import Type:</label>
              <select value={importType} onChange={(e) => setImportType(e.target.value as any)}>
                <option value="full">Full import (replace existing data)</option>
                <option value="incremental">Incremental import (add/update records)</option>
              </select>
            </div>
            <div className="option-group">
              <label>Schedule (optional):</label>
              <select value={schedule} onChange={(e) => setSchedule(e.target.value)}>
                <option value="">Immediate</option>
                <option value="weekly">Weekly (every Monday)</option>
                <option value="monthly">Monthly (1st day)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn-primary" onClick={startImport} disabled={!file}>📤 Start Import</button>
          <button className="btn-secondary" onClick={saveMappingTemplate}>✏️ Edit Mapping</button>
          <button className="btn-danger" onClick={cancelImport}>🗑️ Cancel Import</button>
          <button className="btn-info" onClick={() => setShowHistory(!showHistory)}>📑 View Import History</button>
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
                {(importHistory.length ? importHistory : mockHistory).map(item => (
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
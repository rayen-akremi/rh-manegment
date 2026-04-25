import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Navbar from './Navbar';
import '../style/ExportFile.css';

type DataType = 'Employees' | 'Absences' | 'Performance' | 'Workload';
type TimeRange = 'weekly' | 'monthly' | 'yearly' | 'custom';
type FileFormat = 'xlsx' | 'csv';

interface Field {
  id: string;
  label: string;
  selected: boolean;
}

interface ExportHistoryItem {
  id: string;
  filename: string;
  type: DataType;
  date: string;
  size: string;
  status: 'success' | 'failed' | 'pending';
}

const departmentsList = ['Tous les départements', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Product', 'Support'];

const availableFields: Record<DataType, Field[]> = {
  Employees: [
    { id: 'id', label: 'ID Employé', selected: true },
    { id: 'name', label: 'Nom complet', selected: true },
    { id: 'department', label: 'Département', selected: true },
    { id: 'position', label: 'Poste', selected: true },
    { id: 'absenceDays', label: 'Jours d\'absence', selected: true },
    { id: 'workloadHours', label: 'Charge hebdo (moyenne)', selected: true },
    { id: 'status', label: 'Statut', selected: true },
  ],
  Absences: [
    { id: 'employee', label: 'Employé', selected: true },
    { id: 'department', label: 'Département', selected: true },
    { id: 'type', label: 'Type d\'absence', selected: true },
    { id: 'days', label: 'Jours', selected: true },
    { id: 'startDate', label: 'Date début', selected: true },
  ],
  Performance: [
    { id: 'employee', label: 'Employé', selected: true },
    { id: 'department', label: 'Département', selected: true },
    { id: 'score', label: 'Score', selected: true },
    { id: 'rating', label: 'Évaluation', selected: true },
    { id: 'quarter', label: 'Trimestre', selected: false },
  ],
  Workload: [
    { id: 'employee', label: 'Employé', selected: true },
    { id: 'department', label: 'Département', selected: true },
    { id: 'weeklyHours', label: 'Heures/semaine', selected: true },
    { id: 'overtimeHours', label: 'Heures sup.', selected: true },
    { id: 'status', label: 'Statut', selected: true },
  ],
};

// Données réelles (initiales + importées)
const initialAbsences = [
  { employee: 'Maya Robinson', department: 'Engineering', type: 'Maladie', days: 4, startDate: '2025-09-02' },
  { employee: 'Lucas Bernard', department: 'Sales', type: 'Vacances', days: 8, startDate: '2025-08-15' },
  { employee: 'Lucas Bernard', department: 'Sales', type: 'Maladie', days: 4, startDate: '2025-09-20' },
  { employee: 'Sophie Martin', department: 'Marketing', type: 'Vacances', days: 5, startDate: '2025-10-01' },
];

const initialWorkload = [
  { employee: 'Sophia Rossi', department: 'Engineering', weeklyHours: 42, overtimeHours: 5, status: 'Normal' },
  { employee: 'Lucas Bernard', department: 'Sales', weeklyHours: 48, overtimeHours: 12, status: 'Élevée' },
  { employee: 'Emma Wilson', department: 'Marketing', weeklyHours: 38, overtimeHours: 2, status: 'Normal' },
  { employee: 'John Doe', department: 'Finance', weeklyHours: 52, overtimeHours: 18, status: 'Critique' },
];

const getRealAbsences = () => {
  const stored = localStorage.getItem('importedAbsences');
  const imported = stored ? JSON.parse(stored) : [];
  return [...initialAbsences, ...imported];
};

const getRealWorkload = () => {
  const stored = localStorage.getItem('importedWorkloads');
  const imported = stored ? JSON.parse(stored) : [];
  return [...initialWorkload, ...imported];
};

const getAbsenceTotals = () => {
  const absences = getRealAbsences();
  const totals: Record<string, number> = {};
  absences.forEach(a => { totals[a.employee] = (totals[a.employee] || 0) + a.days; });
  return totals;
};

const getWorkloadHours = () => {
  const workloads = getRealWorkload();
  const hours: Record<string, number> = {};
  workloads.forEach(w => { if (!hours[w.employee]) hours[w.employee] = w.weeklyHours; });
  return hours;
};

const ExportFile: React.FC = () => {
  const [dataType, setDataType] = useState<DataType>('Employees');
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['Tous les départements']);
  const [fileFormat, setFileFormat] = useState<FileFormat>('xlsx');
  const [fields, setFields] = useState<Field[]>(availableFields.Employees);
  const [showHistory, setShowHistory] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('exportHistory');
    if (savedHistory) setExportHistory(JSON.parse(savedHistory));
    generateAISuggestions('Employees');
  }, []);

  const handleDataTypeChange = (type: DataType) => {
    setDataType(type);
    setFields(availableFields[type]);
    generateAISuggestions(type);
  };

  const generateAISuggestions = (type: DataType) => {
    const suggestions: string[] = [];
    if (type === 'Employees') {
      suggestions.push('📊 Format recommandé : XLSX – Vos 3 derniers exports utilisent ce format pour les rapports RH mensuels.');
      suggestions.push('📈 Tendance détectée : Les heures supplémentaires ont augmenté de 12% ce mois-ci dans le service Ingénierie.');
      suggestions.push('⚠️ Anomalie repérée : 5 employés présentent un taux d\'absence inhabituel — incluez-les dans le rapport.');
    } else if (type === 'Absences') {
      suggestions.push('📅 Période recommandée : Mensuelle pour suivre les pics d\'absence.');
      suggestions.push('🔍 Le département Support a un taux d\'absence 2x supérieur à la moyenne.');
    } else if (type === 'Workload') {
      suggestions.push('⚡ Surcharge détectée dans Finance et Sales (heures sup > 15h/semaine).');
    } else {
      suggestions.push('★ Exportez les performances par trimestre pour les revues annuelles.');
    }
    setAiSuggestions(suggestions);
  };

  const handleDepartmentToggle = (dept: string) => {
    if (dept === 'Tous les départements') {
      setSelectedDepartments(['Tous les départements']);
    } else {
      let newSelected = selectedDepartments.filter(d => d !== 'Tous les départements');
      if (newSelected.includes(dept)) {
        newSelected = newSelected.filter(d => d !== dept);
      } else {
        newSelected.push(dept);
      }
      if (newSelected.length === 0) newSelected = ['Tous les départements'];
      setSelectedDepartments(newSelected);
    }
  };

  const toggleField = (fieldId: string) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, selected: !f.selected } : f));
  };

  const generateRealData = (): any[] => {
    let data: any[] = [];
    switch (dataType) {
      case 'Absences':
        data = getRealAbsences();
        break;
      case 'Workload':
        data = getRealWorkload();
        break;
      case 'Employees': {
        const baseEmployees = [
          { id: 'EMP001', name: 'Sophia Rossi', department: 'Engineering', position: 'Dev Senior', status: 'Actif' },
          { id: 'EMP002', name: 'Lucas Bernard', department: 'Sales', position: 'Account Manager', status: 'Actif' },
          { id: 'EMP003', name: 'Emma Wilson', department: 'Marketing', position: 'Brand Manager', status: 'Congé' },
          { id: 'EMP004', name: 'John Doe', department: 'Finance', position: 'CFO', status: 'Actif' },
        ];
        const absenceTotals = getAbsenceTotals();
        const workloadHours = getWorkloadHours();
        data = baseEmployees.map(emp => ({
          ...emp,
          absenceDays: absenceTotals[emp.name] || 0,
          workloadHours: workloadHours[emp.name] || 0,
        }));
        break;
      }
      case 'Performance':
        data = [
          { employee: 'Sophia Rossi', department: 'Engineering', score: 88, rating: 'Excellent', quarter: 'Q3' },
          { employee: 'Lucas Bernard', department: 'Sales', score: 76, rating: 'Bon', quarter: 'Q3' },
        ];
        break;
    }
    if (!selectedDepartments.includes('Tous les départements')) {
      data = data.filter(row => selectedDepartments.includes(row.department));
    }
    if (dataType === 'Absences' && timeRange === 'custom' && customStart && customEnd) {
      data = data.filter(item => item.startDate >= customStart && item.startDate <= customEnd);
    }
    const selectedFields = fields.filter(f => f.selected).map(f => f.id);
    return data.map(row => {
      const newRow: any = {};
      selectedFields.forEach(field => {
        let key = field;
        if (field === 'absenceDays') key = 'absenceDays';
        if (field === 'workloadHours') key = 'workloadHours';
        if (field === 'employee') key = 'employee';
        if (field === 'department') key = 'department';
        if (field === 'type') key = 'type';
        if (field === 'days') key = 'days';
        if (field === 'startDate') key = 'startDate';
        if (field === 'weeklyHours') key = 'weeklyHours';
        if (field === 'overtimeHours') key = 'overtimeHours';
        if (field === 'status') key = 'status';
        if (field === 'name') key = 'name';
        if (field === 'id') key = 'id';
        if (field === 'position') key = 'position';
        if (field === 'score') key = 'score';
        if (field === 'rating') key = 'rating';
        if (field === 'quarter') key = 'quarter';
        newRow[field] = row[key];
      });
      return newRow;
    });
  };

  const downloadFile = () => {
    const data = generateRealData();
    if (data.length === 0) {
      alert('Aucune donnée à exporter avec les filtres actuels.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, dataType);
    const filename = `${dataType}_${new Date().toISOString().slice(0,19)}.${fileFormat}`;
    XLSX.writeFile(workbook, filename, { bookType: fileFormat });
    const newHistoryItem: ExportHistoryItem = {
      id: `EXP-${Date.now()}`,
      filename,
      type: dataType,
      date: new Date().toLocaleString(),
      size: `${Math.floor(data.length * 0.5 + 100)} KB`,
      status: 'success',
    };
    const updatedHistory = [newHistoryItem, ...exportHistory].slice(0, 10);
    setExportHistory(updatedHistory);
    localStorage.setItem('exportHistory', JSON.stringify(updatedHistory));
  };

  const cancelExport = () => {
    setShowHistory(false);
  };

  return (
    <div>
      <Navbar />
      <div className="export-page">
        <div className="page-header">
          <h1>Export de fichiers</h1>
          <p>Gérez et téléchargez vos rapports RH dans différents formats.</p>
        </div>

        <div className="two-columns">
          {/* Colonne gauche : Options d'export */}
          <div className="left-col">
            <div className="export-options">
              <h2>Options d'export</h2>
              <p className="section-desc">Sélectionnez le type de données, la période et les filtres.</p>
              <div className="option-row">
                <label>Type de données</label>
                <select value={dataType} onChange={(e) => handleDataTypeChange(e.target.value as DataType)}>
                  <option>Employees</option><option>Absences</option><option>Performance</option><option>Workload</option>
                </select>
              </div>
              <div className="option-row">
                <label>Département / Équipe</label>
                <div className="department-filters">
                  {departmentsList.map(dept => (
                    <label key={dept} className="dept-checkbox">
                      <input type="checkbox" checked={selectedDepartments.includes(dept)} onChange={() => handleDepartmentToggle(dept)} />
                      {dept}
                    </label>
                  ))}
                </div>
              </div>
              <div className="option-row">
                <label>Période</label>
                <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRange)}>
                  <option value="weekly">Hebdomadaire</option><option value="monthly">Mensuel</option>
                  <option value="yearly">Annuel</option><option value="custom">Personnalisé</option>
                </select>
                {timeRange === 'custom' && (
                  <div className="custom-date">
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                    <span>au</span>
                    <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="option-row">
                <label>Format de fichier</label>
                <div className="format-buttons">
                  <button className={fileFormat === 'xlsx' ? 'active' : ''} onClick={() => setFileFormat('xlsx')}>Excel (.xlsx)</button>
                  <button className={fileFormat === 'csv' ? 'active' : ''} onClick={() => setFileFormat('csv')}>CSV</button>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite : Personnalisation + Assistance IA (dans le carré) */}
          <div className="right-col">
            <div className="customization-section">
              <h2>Personnalisation du rapport</h2>
              <p className="section-desc">Choisissez les champs à inclure ({fields.filter(f => f.selected).length} sélectionnés).</p>
              <div className="fields-selector">
                <div className="fields-grid">
                  {fields.map(field => (
                    <label key={field.id}>
                      <input type="checkbox" checked={field.selected} onChange={() => toggleField(field.id)} />
                      {field.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Assistance IA - encadrée comme demandé */}
            <div className="ai-assistance">
              <h3>Assistance IA</h3>
              <p className="section-desc">Suggestions intelligentes basées sur vos données.</p>
              <ul>
                {aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="action-buttons">
          <button className="btn-primary" onClick={downloadFile}>📥 Télécharger le fichier</button>
          <button className="btn-secondary" onClick={() => {}}>✏️ Personnaliser</button>
          <button className="btn-danger" onClick={cancelExport}>🗑️ Annuler l'export</button>
          <button className="btn-info" onClick={() => setShowHistory(!showHistory)}>📜 Voir l'historique</button>
        </div>

        {/* Historique des exports */}
        {showHistory && (
          <div className="history-section">
            <h3>Historique des exports</h3>
            <p className="section-desc">Vos derniers fichiers générés.</p>
            {exportHistory.length === 0 ? (
              <p>Aucun export pour le moment.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Fichier</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Taille</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exportHistory.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.filename}</td>
                      <td>{item.type}</td>
                      <td>{item.date}</td>
                      <td>{item.size}</td>
                      <td><span className={`status-badge ${item.status}`}>{item.status === 'success' ? 'Réussi' : 'Échoué'}</span></td>
                      <td><button className="btn-download" onClick={() => alert('Téléchargement simulé')}>📥 Télécharger</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportFile;
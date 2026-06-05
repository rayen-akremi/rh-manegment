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
    { id: 'employee_id', label: 'ID Employé', selected: true },
    { id: 'name', label: 'Nom complet', selected: true },
    { id: 'department', label: 'Département', selected: true },
    { id: 'position', label: 'Poste', selected: true },
    { id: 'absenceDays', label: "Jours d'absence", selected: true },
    { id: 'workloadHours', label: 'Charge hebdo (moyenne)', selected: true },
    { id: 'status', label: 'Statut', selected: true },
  ],
  Absences: [
    { id: 'employee', label: 'Employé', selected: true },
    { id: 'department', label: 'Département', selected: true },
    { id: 'type', label: "Type d'absence", selected: true },
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
  const [loading, setLoading] = useState(false);

  // Charger l'historique des exports depuis localStorage
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
      suggestions.push('📊 Format recommandé : XLSX – Exportez les données employés avec leurs absences et charges.');
      suggestions.push('📈 Tendance : Les heures supplémentaires peuvent être analysées par département.');
      suggestions.push('⚠️ Incluez les jours d\'absence pour une vue complète.');
    } else if (type === 'Absences') {
      suggestions.push('📅 Période recommandée : Mensuelle pour suivre les pics d\'absence.');
      suggestions.push('🔍 Filtrez par département pour identifier les équipes à risque.');
    } else if (type === 'Workload') {
      suggestions.push('⚡ Exportez les charges pour détecter les risques de burnout.');
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

  // ========== RÉCUPÉRATION DES DONNÉES RÉELLES DEPUIS LE BACKEND ==========

  // Récupérer tous les employés depuis l'API
  const fetchRealEmployees = async (): Promise<any[]> => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Erreur chargement employés');
      const employees = await response.json();
      
      // Calculer les totaux d'absence et de workload pour chaque employé
      const absences = await fetchRealAbsences();
      const workloads = await fetchRealWorkloads();
      
      // Calculer les jours d'absence par employé
      const absenceTotals: Record<string, number> = {};
      absences.forEach((a: any) => {
        const empName = a.name || a.employee;
        if (empName) {
          absenceTotals[empName] = (absenceTotals[empName] || 0) + (a.days || 0);
        } else if (a.employee_id) {
          absenceTotals[a.employee_id] = (absenceTotals[a.employee_id] || 0) + (a.days || 0);
        }
      });
      
      // Calculer les heures de travail par employé
      const workloadHours: Record<string, number> = {};
      workloads.forEach((w: any) => {
        const empName = w.name || w.employee;
        if (empName) {
          workloadHours[empName] = w.weeklyHours || 0;
        } else if (w.employee_id) {
          workloadHours[w.employee_id] = w.weeklyHours || 0;
        }
      });
      
      return employees.map((emp: any) => ({
        employee_id: emp.employee_id,
        name: `${emp.prenom || ''} ${emp.nom || ''}`.trim(),
        department: emp.departement,
        position: emp.poste,
        status: emp.status,
        age: emp.age,
        absenceDays: absenceTotals[`${emp.prenom} ${emp.nom}`.trim()] || absenceTotals[emp.employee_id] || 0,
        workloadHours: workloadHours[`${emp.prenom} ${emp.nom}`.trim()] || workloadHours[emp.employee_id] || 0,
      }));
    } catch (error) {
      console.error('Erreur fetch employees:', error);
      return [];
    }
  };

  // Récupérer toutes les absences depuis l'API
  const fetchRealAbsences = async (): Promise<any[]> => {
    try {
      const response = await fetch('/api/absences');
      if (!response.ok) throw new Error('Erreur chargement absences');
      return await response.json();
    } catch (error) {
      console.error('Erreur fetch absences:', error);
      return [];
    }
  };

  // Récupérer toutes les charges de travail depuis l'API
  const fetchRealWorkloads = async (): Promise<any[]> => {
    try {
      const response = await fetch('/api/workloads');
      if (!response.ok) throw new Error('Erreur chargement workloads');
      return await response.json();
    } catch (error) {
      console.error('Erreur fetch workloads:', error);
      return [];
    }
  };

  // Récupérer les données de performance (si disponibles)
  const fetchRealPerformances = async (): Promise<any[]> => {
    try {
      const response = await fetch('/api/performances');
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      return [];
    }
  };

  // Générer les données réelles selon le type sélectionné
  const generateRealData = async (): Promise<any[]> => {
    setLoading(true);
    try {
      switch (dataType) {
        case 'Employees': {
          return await fetchRealEmployees();
        }
        case 'Absences': {
          let data = await fetchRealAbsences();
          // Filtrer par département
          if (!selectedDepartments.includes('Tous les départements')) {
            data = data.filter((item: any) => selectedDepartments.includes(item.department));
          }
          // Filtrer par période
          if (timeRange === 'custom' && customStart && customEnd) {
            data = data.filter((item: any) => {
              const itemDate = new Date(item.startDate);
              const start = new Date(customStart);
              const end = new Date(customEnd);
              return itemDate >= start && itemDate <= end;
            });
          }
          // Sélectionner les champs
          const selectedFields = fields.filter(f => f.selected).map(f => f.id);
          return data.map((row: any) => {
            const newRow: any = {};
            selectedFields.forEach(field => {
              if (field === 'employee') newRow[field] = row.name || row.employee;
              else if (field === 'department') newRow[field] = row.department;
              else if (field === 'type') newRow[field] = row.type;
              else if (field === 'days') newRow[field] = row.days;
              else if (field === 'startDate') newRow[field] = row.startDate ? new Date(row.startDate).toISOString().split('T')[0] : '';
              else newRow[field] = row[field];
            });
            return newRow;
          });
        }
        case 'Workload': {
          let data = await fetchRealWorkloads();
          if (!selectedDepartments.includes('Tous les départements')) {
            data = data.filter((item: any) => selectedDepartments.includes(item.department));
          }
          const selectedFields = fields.filter(f => f.selected).map(f => f.id);
          return data.map((row: any) => {
            const newRow: any = {};
            selectedFields.forEach(field => {
              if (field === 'employee') newRow[field] = row.name || row.employee;
              else if (field === 'department') newRow[field] = row.department;
              else if (field === 'weeklyHours') newRow[field] = row.weeklyHours;
              else if (field === 'overtimeHours') newRow[field] = row.overtimeHours;
              else if (field === 'status') newRow[field] = row.status;
              else newRow[field] = row[field];
            });
            return newRow;
          });
        }
        case 'Performance': {
          let data = await fetchRealPerformances();
          const selectedFields = fields.filter(f => f.selected).map(f => f.id);
          return data.map((row: any) => {
            const newRow: any = {};
            selectedFields.forEach(field => {
              newRow[field] = row[field];
            });
            return newRow;
          });
        }
        default:
          return [];
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async () => {
    const data = await generateRealData();
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

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">Chargement des données...</div>
          </div>
        )}

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

          {/* Colonne droite : Personnalisation + Assistance IA */}
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
          <button className="btn-primary" onClick={downloadFile} disabled={loading}>
            📥 Télécharger le fichier
          </button>
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
                      <td><button className="btn-download" onClick={() => alert('Téléchargement')}>📥 Télécharger</button></td>
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
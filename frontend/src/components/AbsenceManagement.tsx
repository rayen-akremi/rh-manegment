import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Navbar from './Navbar';
import '../style/AbsenceManagement.css';

type AbsenceType = 'Sick leave' | 'Vacation' | 'Maternity' | 'Other';

interface AbsenceRecord {
  id: string;
  employee: string;
  department: string;
  type: AbsenceType;
  days: number;
  startDate: string;
}

// Données du graphique
const departmentAbsences = [
  { department: 'Engineering', absences: 13 },
  { department: 'Sales', absences: 18 },
  { department: 'Support', absences: 11 },
  { department: 'Marketing', absences: 9 },
  { department: 'Finance', absences: 8 },
  { department: 'Operations', absences: 7 },
  { department: 'Product', absences: 2 },
];

// Données statiques initiales
const initialAbsences: AbsenceRecord[] = [
  { id: '1', employee: 'Maya Robinson', department: 'Engineering', type: 'Sick leave', days: 4, startDate: '2025-09-02' },
  { id: '2', employee: 'Lucas Bernard', department: 'Sales', type: 'Vacation', days: 8, startDate: '2025-08-15' },
  { id: '3', employee: 'Lucas Bernard', department: 'Sales', type: 'Sick leave', days: 4, startDate: '2025-09-20' },
  { id: '4', employee: 'Sophie Martin', department: 'Marketing', type: 'Vacation', days: 5, startDate: '2025-10-01' },
  { id: '5', employee: 'John Doe', department: 'Finance', type: 'Sick leave', days: 2, startDate: '2025-09-28' },
  { id: '6', employee: 'Emma Wilson', department: 'Operations', type: 'Maternity', days: 90, startDate: '2025-07-15' },
  { id: '7', employee: 'Ali Ben Salah', department: 'Product', type: 'Vacation', days: 10, startDate: '2025-09-10' },
  { id: '8', employee: 'Clara Dupont', department: 'Support', type: 'Sick leave', days: 3, startDate: '2025-09-22' },
];

const AbsenceManagement: React.FC = () => {
  // Chargement des absences depuis localStorage (importées) + initiales
  const storedAbsences = localStorage.getItem('importedAbsences');
  const importedAbsences: AbsenceRecord[] = storedAbsences ? JSON.parse(storedAbsences) : [];
  const [absences, setAbsences] = useState<AbsenceRecord[]>([...initialAbsences, ...importedAbsences]);

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AbsenceRecord | null>(null);
  const [newAbsence, setNewAbsence] = useState({
    employee: '',
    department: '',
    type: 'Sick leave' as AbsenceType,
    days: 1,
    startDate: '',
  });
  const [editForm, setEditForm] = useState({
    employee: '',
    department: '',
    type: 'Sick leave' as AbsenceType,
    days: 1,
    startDate: '',
  });

  // Écoute les imports (storage event) et met à jour l'état
  useEffect(() => {
    const handleStorage = () => {
      const updated = localStorage.getItem('importedAbsences');
      if (updated) {
        const newImported = JSON.parse(updated);
        setAbsences([...initialAbsences, ...newImported]);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const overallAbsenceRate = 0.3;
  const totalAbsenceDays = 70;
  const employeesMoreThan3Absences = 8;

  const departments = ['All departments', ...new Set(absences.map(a => a.department))];
  const types = ['All types', ...new Set(absences.map(a => a.type))];

  const filteredAbsences = absences.filter(rec => {
    const matchSearch = rec.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        rec.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = departmentFilter === 'All departments' || rec.department === departmentFilter;
    const matchType = typeFilter === 'All types' || rec.type === typeFilter;
    return matchSearch && matchDept && matchType;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this absence record?')) {
      setAbsences(absences.filter(a => a.id !== id));
    }
  };

  const handleAddAbsence = () => {
    const newId = (Math.max(...absences.map(a => parseInt(a.id)), 0) + 1).toString();
    const newRecord: AbsenceRecord = {
      id: newId,
      employee: newAbsence.employee,
      department: newAbsence.department,
      type: newAbsence.type,
      days: newAbsence.days,
      startDate: newAbsence.startDate,
    };
    setAbsences([...absences, newRecord]);
    setShowAddModal(false);
    setNewAbsence({ employee: '', department: '', type: 'Sick leave', days: 1, startDate: '' });
  };

  const handleEditClick = (record: AbsenceRecord) => {
    setEditingRecord(record);
    setEditForm({
      employee: record.employee,
      department: record.department,
      type: record.type,
      days: record.days,
      startDate: record.startDate,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    const updatedRecord: AbsenceRecord = {
      ...editingRecord,
      employee: editForm.employee,
      department: editForm.department,
      type: editForm.type,
      days: editForm.days,
      startDate: editForm.startDate,
    };
    setAbsences(absences.map(a => a.id === editingRecord.id ? updatedRecord : a));
    setShowEditModal(false);
    setEditingRecord(null);
  };

  const handleExport = () => {
    const headers = ['Employee', 'Department', 'Type', 'Days', 'Start Date'];
    const rows = filteredAbsences.map(a => [a.employee, a.department, a.type, a.days, a.startDate]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'absence_records.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Navbar />
      <div className="absence-page">
        <div className="page-header">
          <h1>Track & analyze absences</h1>
          <p>Monitor employee absence patterns, surface AI predictions, and export reports for HR review.</p>
        </div>

        {/* KPI Cards */}
        <div className="kpi-cards">
          <div className="kpi-card">
            <div className="kpi-title">OVERALL ABSENCE RATE</div>
            <div className="kpi-value">{overallAbsenceRate}%</div>
            <div className="kpi-delta">vs last month</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">TOTAL ABSENCE DAYS</div>
            <div className="kpi-value">{totalAbsenceDays}</div>
            <div className="kpi-delta">vs last month</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">&gt;3 ABSENCES (EMPLOYEES)</div>
            <div className="kpi-value">{employeesMoreThan3Absences}</div>
            <div className="kpi-delta">vs last month</div>
          </div>
        </div>

        {/* Graph + Buttons */}
        <div className="chart-section">
          <div className="chart-header">
            <h2>Absence by department</h2>
            <div className="chart-buttons">
              <button className="btn-add-absence" onClick={() => setShowAddModal(true)}>+ Add absence</button>
              <button className="btn-export" onClick={handleExport}>📎 Export</button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={departmentAbsences} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" angle={-20} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value) => `${value} days`} />
                <Legend />
                <Bar dataKey="absences" fill="#8884d8" name="Absences (days)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tableau des absences */}
        <div className="records-section">
          <div className="records-header">
            <h2>Absence records</h2>
            <span className="record-count">{filteredAbsences.length} of {absences.length} records</span>
          </div>
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search employees, departments..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="filter-group">
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                {types.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="table-container">
            <table className="absence-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Days</th>
                  <th>Start date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAbsences.map(rec => (
                  <tr key={rec.id}>
                    <td>{rec.employee}</td>
                    <td>{rec.department}</td>
                    <td>{rec.type}</td>
                    <td>{rec.days}</td>
                    <td>{rec.startDate}</td>
                    <td className="actions">
                      <button className="edit-btn" onClick={() => handleEditClick(rec)}>✏️</button>
                      <button className="delete-btn" onClick={() => handleDelete(rec.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
                {filteredAbsences.length === 0 && (
                  <tr>
                    <td colSpan={6} className="no-data">No absence records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Ajout */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add absence record</h2>
            <div className="form-row">
              <div className="form-group"><label>Employee name</label><input value={newAbsence.employee} onChange={e => setNewAbsence({...newAbsence, employee: e.target.value})} /></div>
              <div className="form-group"><label>Department</label><input value={newAbsence.department} onChange={e => setNewAbsence({...newAbsence, department: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Type</label>
                <select value={newAbsence.type} onChange={e => setNewAbsence({...newAbsence, type: e.target.value as AbsenceType})}>
                  <option>Sick leave</option><option>Vacation</option><option>Maternity</option><option>Other</option>
                </select>
              </div>
              <div className="form-group"><label>Days</label><input type="number" value={newAbsence.days} onChange={e => setNewAbsence({...newAbsence, days: parseInt(e.target.value)})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Start date</label><input type="date" value={newAbsence.startDate} onChange={e => setNewAbsence({...newAbsence, startDate: e.target.value})} /></div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleAddAbsence}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Édition */}
      {showEditModal && editingRecord && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit absence record</h2>
            <div className="form-row">
              <div className="form-group"><label>Employee name</label><input value={editForm.employee} onChange={e => setEditForm({...editForm, employee: e.target.value})} /></div>
              <div className="form-group"><label>Department</label><input value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Type</label>
                <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value as AbsenceType})}>
                  <option>Sick leave</option><option>Vacation</option><option>Maternity</option><option>Other</option>
                </select>
              </div>
              <div className="form-group"><label>Days</label><input type="number" value={editForm.days} onChange={e => setEditForm({...editForm, days: parseInt(e.target.value)})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Start date</label><input type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} /></div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleSaveEdit}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceManagement;
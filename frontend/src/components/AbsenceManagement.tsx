import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Navbar from './Navbar';
import '../style/AbsenceManagement.css';

type AbsenceType = 'Sick leave' | 'Vacation' | 'Maternity' | 'non justifer';

interface AbsenceRecord {
  id: string;
  employeeId: string;
  employee: string;
  department: string;
  type: AbsenceType;
  days: number;
  startDate: string;
}

const AbsenceManagement: React.FC = () => {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AbsenceRecord | null>(null);
  const [newAbsence, setNewAbsence] = useState({
    employeeId: '',
    employee: '',
    department: '',
    type: 'Sick leave' as AbsenceType,
    days: 1,
    startDate: '',
  });
  const [editForm, setEditForm] = useState({
    employeeId: '',
    employee: '',
    department: '',
    type: 'Sick leave' as AbsenceType,
    days: 1,
    startDate: '',
  });

  // ========== FETCH FROM BACKEND ==========
  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/absences');
      if (!response.ok) throw new Error('Erreur chargement');
      const data = await response.json();
      
      const formattedAbsences: AbsenceRecord[] = (data || []).map((item: any) => ({
        id: item.absence_id || item._id || `temp-${Date.now()}`,
        employeeId: item.employee_id || '',
        employee: item.name || item.employee || 'Unknown',
        department: item.department || 'Unknown',
        type: (item.type as AbsenceType) || 'Other',
        days: item.days || 0,
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      }));
      
      setAbsences(formattedAbsences);
      setError('');
    } catch (err) {
      console.error('Error fetching absences:', err);
      setError('Impossible de charger les absences');
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, []);

  // ========== ADD ABSENCE ==========
  const handleAddAbsence = async () => {
    if (!newAbsence.employeeId.trim()) { alert("L'ID employé est requis"); return; }
    if (!newAbsence.employee.trim()) { alert("Le nom est requis"); return; }
    if (!newAbsence.department) { alert("Le département est requis"); return; }
    if (newAbsence.days < 1) { alert("Les jours doivent être >= 1"); return; }
    if (!newAbsence.startDate) { alert("La date est requise"); return; }

    const payload = {
      absence_id: `ABS${Date.now()}`,
      employee_id: newAbsence.employeeId,
      name: newAbsence.employee,
      department: newAbsence.department,
      type: newAbsence.type,
      days: newAbsence.days,
      startDate: newAbsence.startDate,
    };

    try {
      const response = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Erreur ajout');
      await fetchAbsences();
      setShowAddModal(false);
      setNewAbsence({ employeeId: '', employee: '', department: '', type: 'Sick leave', days: 1, startDate: '' });
    } catch (err) {
      alert('Erreur lors de l\'ajout');
    }
  };

  // ========== DELETE ABSENCE ==========
  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet enregistrement ?')) return;
    try {
      const response = await fetch(`/api/absences/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur suppression');
      await fetchAbsences();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // ========== EDIT ABSENCE ==========
  const handleEditClick = (record: AbsenceRecord) => {
    setEditingRecord(record);
    setEditForm({
      employeeId: record.employeeId || '',
      employee: record.employee || '',
      department: record.department || '',
      type: record.type || 'Sick leave',
      days: record.days || 1,
      startDate: record.startDate || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    
    const payload = {
      name: editForm.employee,
      department: editForm.department,
      type: editForm.type,
      days: editForm.days,
      startDate: editForm.startDate,
    };

    try {
      const response = await fetch(`/api/absences/${editingRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Erreur modification');
      await fetchAbsences();
      setShowEditModal(false);
      setEditingRecord(null);
    } catch (err) {
      alert('Erreur lors de la modification');
    }
  };

  // ========== EXPORT CSV ==========
  const handleExport = () => {
    if (absences.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    const headers = ['Employee ID', 'Employee', 'Department', 'Type', 'Days', 'Start Date'];
    const rows = absences.map(a => [
      a.employeeId || '',
      a.employee || '',
      a.department || '',
      a.type || '',
      a.days || 0,
      a.startDate || '',
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'absence_records.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== CALCULATIONS ==========
  const departmentAbsences = absences.reduce((acc: any[], curr) => {
    if (!curr.department) return acc;
    const existing = acc.find(a => a.department === curr.department);
    if (existing) {
      existing.absences += (curr.days || 0);
    } else {
      acc.push({ department: curr.department, absences: curr.days || 0 });
    }
    return acc;
  }, []);

  const totalAbsenceDays = absences.reduce((sum, a) => sum + (a.days || 0), 0);
  const overallAbsenceRate = absences.length ? ((totalAbsenceDays / (absences.length * 30)) * 100).toFixed(1) : 0;
  const employeesMoreThan3Absences = new Set(absences.filter(a => (a.days || 0) > 3).map(a => a.employee)).size;

  const departmentList = Array.from(new Set(absences.map(a => a.department).filter(Boolean))).sort();
  const departments = ['All departments', ...departmentList];
  const types = ['All types', ...new Set(absences.map(a => a.type).filter(Boolean))];

  const filteredAbsences = absences.filter(rec => {
    if (!rec) return false;
    const searchLower = (searchTerm || '').toLowerCase();
    const matchSearch = (rec.employee || '').toLowerCase().includes(searchLower) ||
                        (rec.department || '').toLowerCase().includes(searchLower) ||
                        (rec.employeeId || '').toLowerCase().includes(searchLower);
    const matchDept = departmentFilter === 'All departments' || rec.department === departmentFilter;
    const matchType = typeFilter === 'All types' || rec.type === typeFilter;
    return matchSearch && matchDept && matchType;
  });

  if (loading) return <div style={{ marginLeft: '260px', padding: '2rem' }}>Chargement des absences...</div>;
  if (error) return <div style={{ color: 'red', marginLeft: '260px', padding: '2rem' }}>{error}</div>;

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

        {/* Chart */}
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
              <BarChart data={departmentAbsences}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} days`} />
                <Legend />
                <Bar dataKey="absences" fill="#8884d8" name="Absences (days)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="records-section">
          <div className="records-header">
            <h2>Absence records</h2>
            <span className="record-count">{filteredAbsences.length} of {absences.length} records</span>
          </div>
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search employees, ID, departments..."
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
                  <th>Employee ID</th>
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
                    <td>{rec.employeeId || '-'}</td>
                    <td>{rec.employee || '-'}</td>
                    <td>{rec.department || '-'}</td>
                    <td>{rec.type || '-'}</td>
                    <td>{rec.days || 0}</td>
                    <td>{rec.startDate || '-'}</td>
                    <td className="actions">
                      <button className="edit-btn" onClick={() => handleEditClick(rec)}>✏️</button>
                      <button className="delete-btn" onClick={() => handleDelete(rec.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
                {filteredAbsences.length === 0 && (
                  <tr>
                    <td colSpan={7} className="no-data">No absence records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add absence record</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g., EMP001"
                  value={newAbsence.employeeId}
                  onChange={(e) => setNewAbsence({ ...newAbsence, employeeId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Employee name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={newAbsence.employee}
                  onChange={(e) => setNewAbsence({ ...newAbsence, employee: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select
                  value={newAbsence.department}
                  onChange={(e) => setNewAbsence({ ...newAbsence, department: e.target.value })}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departmentList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={newAbsence.type}
                  onChange={(e) => setNewAbsence({ ...newAbsence, type: e.target.value as AbsenceType })}
                >
                  <option>Sick leave</option>
                  <option>Vacation</option>
                  <option>Maternity</option>
                  <option>non justifer</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Days</label>
                <input
                  type="number"
                  value={newAbsence.days}
                  onChange={(e) => setNewAbsence({ ...newAbsence, days: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Start date</label>
                <input
                  type="date"
                  value={newAbsence.startDate}
                  onChange={(e) => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleAddAbsence}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit absence record</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  value={editForm.employeeId}
                  onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Employee name</label>
                <input
                  type="text"
                  value={editForm.employee}
                  onChange={(e) => setEditForm({ ...editForm, employee: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departmentList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as AbsenceType })}
                >
                  <option>Sick leave</option>
                  <option>Vacation</option>
                  <option>Maternity</option>
                  <option>non justifer</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Days</label>
                <input
                  type="number"
                  value={editForm.days}
                  onChange={(e) => setEditForm({ ...editForm, days: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Start date</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
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
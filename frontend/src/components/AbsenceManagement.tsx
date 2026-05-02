import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Navbar from './Navbar';
import '../style/AbsenceManagement.css';

type AbsenceType = 'Sick leave' | 'Vacation' | 'Maternity' | 'Other';

interface AbsenceRecord {
  id: string;
  employeeId: string;
  employee: string;
  department: string;
  type: AbsenceType;
  days: number;
  startDate: string;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  matricule: string;
}

const AbsenceManagement: React.FC = () => {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AbsenceRecord | null>(null);
  
  // Searchable select states
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter employees based on search term (search by name, id, or matricule)
  const filteredEmployees = employees.filter(emp => {
    const searchLower = employeeSearchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(searchLower) || 
           emp.id.toLowerCase().includes(searchLower) ||
           emp.matricule.toLowerCase().includes(searchLower);
  });

  // Fetch all employees from backend
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Erreur chargement employés');
      const data = await response.json();
      
      // Handle different response structures
      let employeeArray = [];
      if (Array.isArray(data)) {
        employeeArray = data;
      } else if (data.employees && Array.isArray(data.employees)) {
        employeeArray = data.employees;
      } else if (data.data && Array.isArray(data.data)) {
        employeeArray = data.data;
      } else {
        employeeArray = [];
      }
      
      // Map employee data correctly with matricule
      const employeeList: Employee[] = employeeArray.map((emp: any) => ({
        id: emp.employee_id || emp.matricule || emp.id,
        name: `${emp.prenom || ''} ${emp.nom || ''}`.trim() || emp.name || `Employee ${emp.matricule || emp.employee_id}`,
        department: emp.departement || emp.department || 'Unknown',
        matricule: emp.matricule || emp.employee_id || emp.id || ''
      }));
      
      console.log('Loaded employees:', employeeList);
      setEmployees(employeeList);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Fetch all absences from backend
  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/absences');
      if (!response.ok) throw new Error('Erreur chargement');
      const data = await response.json();
      
      let absencesArray = [];
      if (Array.isArray(data)) {
        absencesArray = data;
      } else if (data.absences && Array.isArray(data.absences)) {
        absencesArray = data.absences;
      } else {
        absencesArray = [];
      }
      
      const formattedAbsences: AbsenceRecord[] = absencesArray.map((item: any) => ({
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
    fetchEmployees();
    fetchAbsences();
  }, []);

  // Handle employee selection
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setNewAbsence({
      ...newAbsence,
      employeeId: employee.id,
      employee: employee.name,
      department: employee.department,
    });
    setEmployeeSearchTerm('');
    setIsDropdownOpen(false);
  };

  // Clear selected employee
  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setNewAbsence({
      ...newAbsence,
      employeeId: '',
      employee: '',
      department: '',
    });
    setEmployeeSearchTerm('');
  };

  // ========== ADD ABSENCE ==========
  const handleAddAbsence = async () => {
    if (!newAbsence.employeeId.trim()) { alert("Veuillez sélectionner un employé"); return; }
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
      setSelectedEmployee(null);
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
  const types = ['All types', 'Sick leave', 'Vacation', 'Maternity', 'Other'];

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

      {/* Add Modal with Searchable Employee Selector */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add absence record</h2>
            
            {/* Searchable Employee Select */}
            <div className="form-group" ref={dropdownRef}>
              <label>Select Employee *</label>
              <div className="searchable-select">
                <div 
                  className="select-input"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {selectedEmployee ? (
                    <div className="selected-employee">
                      <span className="emp-name">{selectedEmployee.name}</span>
                      <span className="emp-id">Matricule: {selectedEmployee.matricule}</span>
                      <span className="emp-dept">- {selectedEmployee.department}</span>
                      <button 
                        className="clear-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearEmployee();
                        }}
                      >
                        ✖
                      </button>
                    </div>
                  ) : (
                    <span className="placeholder">Search by name, ID, or matricule...</span>
                  )}
                  <span className="dropdown-arrow">▼</span>
                </div>
                
                {isDropdownOpen && (
                  <div className="dropdown-list">
                    <input
                      type="text"
                      className="dropdown-search"
                      placeholder="Type name, ID, or matricule to search..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <div className="dropdown-items">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(emp => (
                          <div
                            key={emp.id}
                            className="dropdown-item"
                            onClick={() => handleEmployeeSelect(emp)}
                          >
                            <div className="item-name">{emp.name}</div>
                            <div className="item-details">
                              <span className="item-id">Matricule: {emp.matricule}</span>
                              <span className="item-dept">{emp.department}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-results">No employees found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedEmployee && (
              <>
                <div className="info-row">
                  <span className="info-label">Department:</span>
                  <span className="info-value">{newAbsence.department || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Employee ID:</span>
                  <span className="info-value">{newAbsence.employeeId || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Matricule:</span>
                  <span className="info-value">{selectedEmployee.matricule || '-'}</span>
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={newAbsence.type}
                  onChange={(e) => setNewAbsence({ ...newAbsence, type: e.target.value as AbsenceType })}
                >
                  <option>Sick leave</option>
                  <option>Vacation</option>
                  <option>Maternity</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Days</label>
                <input
                  type="number"
                  min="1"
                  value={newAbsence.days}
                  onChange={(e) => setNewAbsence({ ...newAbsence, days: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-row">
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
                <label>Employee</label>
                <input type="text" value={editForm.employee} readOnly disabled />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input type="text" value={editForm.department} readOnly disabled />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as AbsenceType })}
                >
                  <option>Sick leave</option>
                  <option>Vacation</option>
                  <option>Maternity</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Days</label>
                <input
                  type="number"
                  value={editForm.days}
                  onChange={(e) => setEditForm({ ...editForm, days: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-row">
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
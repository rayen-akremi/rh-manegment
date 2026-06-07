import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Navbar from './Navbar';
import '../style/AbsenceManagement.css';

type AbsenceType = 'Congé maladie' | 'Congé payé' | 'Congé maternité' | 'Autre';

interface AbsenceRecord {
  id: string;
  employeeId: string;
  employee: string;
  department: string;
  type: AbsenceType;
  days: number;
  hours?: number;
  startDate: string;
  fromRecap?: boolean;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  matricule: string;
}

// ✅ Composant Toast pour notification automatique
const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="custom-toast">
      <span className="toast-icon">✅</span>
      <span className="toast-message">{message}</span>
    </div>
  );
};

const AbsenceManagement: React.FC = () => {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recapAbsenceHours, setRecapAbsenceHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('Tous les départements');
  const [typeFilter, setTypeFilter] = useState('Tous les types');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AbsenceRecord | null>(null);
  
  // ✅ État pour le message de notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Searchable select states
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [newAbsence, setNewAbsence] = useState({
    employeeId: '',
    employee: '',
    department: '',
    type: 'Congé maladie' as AbsenceType,
    days: 1,
    startDate: '',
  });
  const [editForm, setEditForm] = useState({
    employeeId: '',
    employee: '',
    department: '',
    type: 'Congé maladie' as AbsenceType,
    days: 1,
    startDate: '',
  });

  // ✅ Afficher le message stocké après le rafraîchissement
  useEffect(() => {
    const storedMessage = sessionStorage.getItem('successMessage');
    if (storedMessage) {
      setToastMessage(storedMessage);
      sessionStorage.removeItem('successMessage');
    }
  }, []);

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

  // Filter employees based on search term
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
      
      const employeeList: Employee[] = employeeArray.map((emp: any) => ({
        id: emp.employee_id || emp.matricule || emp.id,
        name: `${emp.prenom || ''} ${emp.nom || ''}`.trim() || emp.name || `Employé ${emp.matricule || emp.employee_id}`,
        department: emp.departement || emp.department || 'Inconnu',
        matricule: emp.matricule || emp.employee_id || emp.id || ''
      }));
      
      console.log('Employés chargés:', employeeList);
      setEmployees(employeeList);
    } catch (err) {
      console.error('Erreur chargement employés:', err);
    }
  };

  // Fetch all absences from backend
  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const [response, recapResponse] = await Promise.all([
        fetch('/api/absences'),
        fetch('/api/monthly-recap')
      ]);
      if (!response.ok) throw new Error('Erreur chargement');
      const data = await response.json();
      const recapRows = recapResponse.ok ? await recapResponse.json() : [];
      if (recapRows.length) {
        const recapAbsences: AbsenceRecord[] = recapRows.map((item: any) => ({
          id: item._id || item.matricule,
          employeeId: item.matricule || '',
          employee: item.employeeName || 'Inconnu',
          department: item.department || 'Inconnu',
          type: 'Autre',
          days: item.absenceDays || 0,
          hours: item.absenceHours || 0,
          startDate: '',
          fromRecap: true
        }));

        setRecapAbsenceHours(recapAbsences.reduce((sum, item) => sum + (item.hours || 0), 0));
        setAbsences(recapAbsences);
        setError('');
        return;
      }
      if (recapResponse.ok) {
        setRecapAbsenceHours(0);
      }
      
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
        employee: item.name || item.employee || 'Inconnu',
        department: item.department || 'Inconnu',
        type: (() => {
          switch (item.type) {
            case 'Sick leave': return 'Congé maladie';
            case 'Vacation': return 'Congé payé';
            case 'Maternity': return 'Congé maternité';
            default: return 'Autre';
          }
        })(),
        days: item.days || 0,
        hours: (item.days || 0) * 8,
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      }));
      
      setAbsences(formattedAbsences);
      setError('');
    } catch (err) {
      console.error('Erreur chargement absences:', err);
      setError('Impossible de charger les absences');
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = () => {
    fetchEmployees();
    fetchAbsences();
  };

  useEffect(() => {
    fetchEmployees();
    fetchAbsences();
    
    const handleEmployeeDeleted = () => {
      console.log('Événement suppression employé reçu - rafraîchissement des absences');
      fetchAbsences();
    };
    
    window.addEventListener('employee-deleted', handleEmployeeDeleted);
    
    const refresh = () => {
      fetchEmployees();
      fetchAbsences();
    };
    window.addEventListener('monthly-recap-imported', refresh);
    window.addEventListener('storage', refresh);
    
    return () => {
      window.removeEventListener('employee-deleted', handleEmployeeDeleted);
      window.removeEventListener('monthly-recap-imported', refresh);
      window.removeEventListener('storage', refresh);
    };
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
    if (!newAbsence.employeeId.trim()) { setToastMessage("⚠️ Veuillez sélectionner un employé"); return; }
    if (newAbsence.days < 1) { setToastMessage("⚠️ Les jours doivent être >= 1"); return; }
    if (!newAbsence.startDate) { setToastMessage("⚠️ La date est requise"); return; }

    // Convertir le type en anglais pour l'API
    let typeEn = 'Other';
    if (newAbsence.type === 'Congé maladie') typeEn = 'Sick leave';
    else if (newAbsence.type === 'Congé payé') typeEn = 'Vacation';
    else if (newAbsence.type === 'Congé maternité') typeEn = 'Maternity';

    const payload = {
      absence_id: `ABS${Date.now()}`,
      employee_id: newAbsence.employeeId,
      name: newAbsence.employee,
      department: newAbsence.department,
      type: typeEn,
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
      
      const successMsg = ` Absence ajoutée avec succès pour ${newAbsence.employee} (${newAbsence.days} jour(s))`;
      sessionStorage.setItem('successMessage', successMsg);
      
      setShowAddModal(false);
      setSelectedEmployee(null);
      setNewAbsence({ employeeId: '', employee: '', department: '', type: 'Congé maladie', days: 1, startDate: '' });
      
      window.location.reload();
      
    } catch (err) {
      setToastMessage("❌ Erreur lors de l'ajout");
    }
  };

  // ========== DELETE ABSENCE ==========
  const handleDelete = async (id: string) => {
    if (!window.confirm('❌ Supprimer cet enregistrement ?')) return;
    try {
      const response = await fetch(`/api/absences/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur suppression');
      
      sessionStorage.setItem('successMessage', '🗑️ Absence supprimée avec succès');
      window.location.reload();
      
    } catch (err) {
      setToastMessage("❌ Erreur lors de la suppression");
    }
  };

  // ========== EDIT ABSENCE ==========
  const handleEditClick = (record: AbsenceRecord) => {
    setEditingRecord(record);
    setEditForm({
      employeeId: record.employeeId || '',
      employee: record.employee || '',
      department: record.department || '',
      type: record.type || 'Congé maladie',
      days: record.days || 1,
      startDate: record.startDate || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    
    // Convertir le type en anglais pour l'API
    let typeEn = 'Other';
    if (editForm.type === 'Congé maladie') typeEn = 'Sick leave';
    else if (editForm.type === 'Congé payé') typeEn = 'Vacation';
    else if (editForm.type === 'Congé maternité') typeEn = 'Maternity';
    
    const payload = {
      name: editForm.employee,
      department: editForm.department,
      type: typeEn,
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
      
      sessionStorage.setItem('successMessage', `✏️ Absence modifiée avec succès pour ${editForm.employee}`);
      
      setShowEditModal(false);
      setEditingRecord(null);
      
      window.location.reload();
      
    } catch (err) {
      setToastMessage("❌ Erreur lors de la modification");
    }
  };

  // ========== EXPORT CSV ==========
  const handleExport = () => {
    if (absences.length === 0) {
      setToastMessage(" Aucune donnée à exporter");
      return;
    }
    const headers = ['ID Employé', 'Employé', 'Département', 'Jours d\'absence'];
    const rows = absences.map(a => [
      a.employeeId || '',
      a.employee || '',
      a.department || '',
      a.days || 0,
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'absence_records.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage(" Rapport exporté avec succès");
  };

  // ========== CALCULATIONS ==========
  const departmentAbsences = absences.reduce((acc: any[], curr) => {
    if (!curr.department) return acc;
    const existing = acc.find(a => a.department === curr.department);
    if (existing) {
      existing.absences += (curr.hours || ((curr.days || 0) * 8));
    } else {
      acc.push({ department: curr.department, absences: curr.hours || ((curr.days || 0) * 8) });
    }
    return acc;
  }, []);

  const totalAbsenceDays = absences.reduce((sum, a) => sum + (a.days || 0), 0);
  const totalAbsenceHours = recapAbsenceHours || totalAbsenceDays * 8;
  const overallAbsenceRate = absences.length ? ((totalAbsenceDays / (absences.length * 30)) * 100).toFixed(1) : 0;
  const employeesMoreThan3Absences = new Set(absences.filter(a => (a.days || 0) > 3).map(a => a.employee)).size;

  const departmentList = Array.from(new Set(absences.map(a => a.department).filter(Boolean))).sort();
  const departments = ['Tous les départements', ...departmentList];
  const types = ['Tous les types', 'Congé maladie', 'Congé payé', 'Congé maternité', 'Autre'];

  const filteredAbsences = absences.filter(rec => {
    if (!rec) return false;
    const searchLower = (searchTerm || '').toLowerCase();
    const matchSearch = (rec.employee || '').toLowerCase().includes(searchLower) ||
                        (rec.department || '').toLowerCase().includes(searchLower) ||
                        (rec.employeeId || '').toLowerCase().includes(searchLower);
    const matchDept = departmentFilter === 'Tous les départements' || rec.department === departmentFilter;
    const matchType = typeFilter === 'Tous les types' || rec.type === typeFilter;
    return matchSearch && matchDept && matchType;
  });

  if (loading) return <div style={{ marginLeft: '260px', padding: '2rem' }}> Chargement des absences...</div>;
  if (error) return <div style={{ color: 'red', marginLeft: '260px', padding: '2rem' }}>❌ {error}</div>;

  return (
    <div>
      <Navbar />
      <div className="absence-page">
        <div className="page-header">
          <h1> Suivi et analyse des absences</h1>
          <p>Analysez les tendances d'absence, recevez des prédictions IA et exportez des rapports RH.</p>
        </div>

        {/* ✅ Toast Notification */}
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}

        {/* KPI Cards - Sans "vs mois dernier" */}
        <div className="kpi-cards">
          <div className="kpi-card">
            <div className="kpi-title">TAUX D'ABSENCE GLOBAL</div>
            <div className="kpi-value">{overallAbsenceRate}%</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">TOTAL JOURS D'ABSENCE</div>
            <div className="kpi-value">{totalAbsenceDays}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">HEURES D'ABSENCE</div>
            <div className="kpi-value">{totalAbsenceHours.toFixed(1)} h</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">&gt;3 ABSENCES (EMPLOYÉS)</div>
            <div className="kpi-value">{employeesMoreThan3Absences}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-section">
          <div className="chart-header">
            <h2> Absences par département</h2>
            <div className="chart-buttons">
              <button className="btn-add-absence" onClick={() => setShowAddModal(true)}>+ Ajouter absence</button>
              <button className="btn-export" onClick={handleExport}>📎 Exporter</button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={departmentAbsences}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} heures`} />
                <Legend />
                <Bar dataKey="absences" fill="#8884d8" name="Heures d'absence" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="records-section">
          <div className="records-header">
            <h2> Liste des absences</h2>
            <span className="record-count">{filteredAbsences.length} sur {absences.length} enregistrements</span>
          </div>
          <div className="filters-bar">
            <input
              type="text"
              placeholder=" Rechercher employé, ID, département..."
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
                  <th>ID Employé</th>
                  <th>Employé</th>
                  <th>Département</th>
                  <th>Jours d'absence</th>
                </tr>
              </thead>
              <tbody>
                {filteredAbsences.map(rec => (
                  <tr key={rec.id}>
                    <td>{rec.employeeId || '-'}</td>
                    <td>{rec.employee || '-'}</td>
                    <td>{rec.department || '-'}</td>
                    <td>{rec.days || 0}</td>
                  </tr>
                ))}
                {filteredAbsences.length === 0 && (
                  <tr>
                    <td colSpan={4} className="no-data">📭 Aucun enregistrement d'absence trouvé.</td>
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
            <h2> Ajouter une absence</h2>
            
            <div className="form-group" ref={dropdownRef}>
              <label> Sélectionner un employé *</label>
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
                    <span className="placeholder"> Rechercher par nom, ID ou matricule...</span>
                  )}
                  <span className="dropdown-arrow">▼</span>
                </div>
                
                {isDropdownOpen && (
                  <div className="dropdown-list">
                    <input
                      type="text"
                      className="dropdown-search"
                      placeholder="Tapez le nom, l'ID ou le matricule..."
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
                        <div className="no-results"> Aucun employé trouvé</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedEmployee && (
              <>
                <div className="info-row">
                  <span className="info-label"> Département:</span>
                  <span className="info-value">{newAbsence.department || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label"> ID Employé:</span>
                  <span className="info-value">{newAbsence.employeeId || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label"> Matricule:</span>
                  <span className="info-value">{selectedEmployee.matricule || '-'}</span>
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Type d'absence</label>
                <select
                  value={newAbsence.type}
                  onChange={(e) => setNewAbsence({ ...newAbsence, type: e.target.value as AbsenceType })}
                >
                  <option>Congé maladie</option>
                  <option>Congé payé</option>
                  <option>Congé maternité</option>
                  <option>Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label> Nombre de jours</label>
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
                <label> Date de début</label>
                <input
                  type="date"
                  value={newAbsence.startDate}
                  onChange={(e) => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Annuler</button>
              <button className="btn-submit" onClick={handleAddAbsence}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>✏️ Modifier l'absence</h2>
            <div className="form-row">
              <div className="form-group">
                <label>👤 Employé</label>
                <input type="text" value={editForm.employee} readOnly disabled />
              </div>
              <div className="form-group">
                <label>🏢 Département</label>
                <input type="text" value={editForm.department} readOnly disabled />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>📋 Type d'absence</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as AbsenceType })}
                >
                  <option>Congé maladie</option>
                  <option>Congé payé</option>
                  <option>Congé maternité</option>
                  <option>Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label>📅 Nombre de jours</label>
                <input
                  type="number"
                  value={editForm.days}
                  onChange={(e) => setEditForm({ ...editForm, days: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>📆 Date de début</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button className="btn-submit" onClick={handleSaveEdit}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceManagement;
import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import Navbar from './Navbar';
import '../style/WorkloadManagement.css';

type WorkloadStatus = 'Normal' | 'High' | 'Critical';

interface EmployeeWorkload {
  id: string;
  employeeId?: string;
  name: string;
  department: string;
  weeklyHours: number;
  overtimeHours: number;
  overtime25?: number;
  overtime50?: number;
  overtime100?: number;
  nightHours?: number;
  status: WorkloadStatus;
  fromRecap?: boolean;
}

interface Employee {
  id: string;
  employee_id: string;
  matricule: string;
  nom: string;
  prenom: string;
  departement: string;
  poste: string;
}

// Toast component for notifications
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

const WorkloadManagement: React.FC = () => {
  const [workloads, setWorkloads] = useState<EmployeeWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorkload, setEditingWorkload] = useState<EmployeeWorkload | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Searchable select states (like in AbsenceManagement)
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [newWorkload, setNewWorkload] = useState({
    employeeId: '',
    name: '',
    department: '',
    weeklyHours: 0,
    overtimeHours: 0,
    overtime25: 0,
    overtime50: 0,
    overtime100: 0,
    nightHours: 0,
    status: 'Normal' as WorkloadStatus
  });

  const [editForm, setEditForm] = useState({
    employeeId: '',
    name: '',
    department: '',
    weeklyHours: 0,
    overtimeHours: 0,
    overtime25: 0,
    overtime50: 0,
    overtime100: 0,
    nightHours: 0,
    status: 'Normal' as WorkloadStatus
  });

  // Load stored message after refresh
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
    return emp.nom?.toLowerCase().includes(searchLower) || 
           emp.prenom?.toLowerCase().includes(searchLower) ||
           emp.matricule?.toLowerCase().includes(searchLower) ||
           emp.employee_id?.toLowerCase().includes(searchLower) ||
           `${emp.nom} ${emp.prenom}`.toLowerCase().includes(searchLower);
  });

  // Charger les employés
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        let employeeArray = [];
        if (Array.isArray(data)) {
          employeeArray = data;
        } else if (data.employees && Array.isArray(data.employees)) {
          employeeArray = data.employees;
        } else {
          employeeArray = [];
        }
        
        const employeeList: Employee[] = employeeArray.map((emp: any) => ({
          id: emp.employee_id || emp.matricule || emp.id,
          employee_id: emp.employee_id || emp.matricule || emp.id,
          matricule: emp.matricule || emp.employee_id || emp.id || '',
          nom: emp.nom || '',
          prenom: emp.prenom || '',
          departement: emp.departement || emp.department || 'Unknown',
          poste: emp.poste || ''
        }));
        
        setEmployees(employeeList);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setNewWorkload({
      ...newWorkload,
      employeeId: employee.employee_id || employee.matricule || employee.id,
      name: `${employee.nom} ${employee.prenom}`.trim(),
      department: employee.departement,
    });
    setEmployeeSearchTerm('');
    setIsDropdownOpen(false);
  };

  // Clear selected employee
  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setNewWorkload({
      ...newWorkload,
      employeeId: '',
      name: '',
      department: '',
    });
    setEmployeeSearchTerm('');
  };

  // ========== FETCH WORKLOADS FROM BACKEND ==========
  const fetchWorkloads = async () => {
    try {
      setLoading(true);
      const [response, recapResponse] = await Promise.all([
        fetch('/api/workloads'),
        fetch('/api/monthly-recap')
      ]);
      if (!response.ok) throw new Error('Erreur chargement');
      const data = await response.json();
      const recapData = recapResponse.ok ? await recapResponse.json() : [];
      
      const formattedWorkloads: EmployeeWorkload[] = (data || []).map((item: any) => ({
        id: item.workload_id || item._id,
        employeeId: item.employee_id,
        name: item.name || '',
        department: item.department || '',
        weeklyHours: item.weeklyHours || 0,
        overtimeHours: item.overtimeHours || 0,
        overtime25: item.overtime25 || 0,
        overtime50: item.overtime50 || 0,
        overtime100: item.overtime100 || 0,
        nightHours: item.nightHours || 0,
        status: item.status || 'Normal'
      }));

      const recapWorkloads: EmployeeWorkload[] = (recapData || []).map((item: any) => {
        const overtimeHours = (item.overtime25 || 0) + (item.overtime50 || 0) + (item.overtime100 || 0);
        let status: WorkloadStatus = 'Normal';
        if ((item.htHours || 0) >= 180 || overtimeHours >= 40) status = 'Critical';
        else if ((item.htHours || 0) >= 168 || overtimeHours >= 15) status = 'High';
        return {
          id: item._id || item.matricule,
          employeeId: item.matricule,
          name: item.employeeName || '',
          department: item.department || '',
          weeklyHours: item.htHours || 0,
          overtimeHours,
          overtime25: item.overtime25 || 0,
          overtime50: item.overtime50 || 0,
          overtime100: item.overtime100 || 0,
          nightHours: item.nightHours || 0,
          status,
          fromRecap: true
        };
      });
      
      setWorkloads(recapWorkloads.length ? recapWorkloads : formattedWorkloads);
      setError('');
    } catch (err) {
      console.error('Error fetching workloads:', err);
      setError('Impossible de charger les charges de travail');
      setWorkloads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloads();
    fetchEmployees();
    
    const handleEmployeeDeleted = () => {
      fetchWorkloads();
    };
    
    window.addEventListener('employee-deleted', handleEmployeeDeleted);
    const refresh = () => fetchWorkloads();
    window.addEventListener('monthly-recap-imported', refresh);
    window.addEventListener('storage', refresh);
    
    return () => {
      window.removeEventListener('employee-deleted', handleEmployeeDeleted);
      window.removeEventListener('monthly-recap-imported', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // ========== ADD WORKLOAD ==========
  const handleAdd = async () => {
    if (!newWorkload.employeeId.trim()) { setToastMessage("⚠️ Veuillez sélectionner un employé"); return; }
    if (newWorkload.weeklyHours < 0) { setToastMessage("⚠️ Les heures hebdomadaires doivent être >= 0"); return; }

    const payload = {
      workload_id: `WL${Date.now()}`,
      employee_id: newWorkload.employeeId,
      name: newWorkload.name,
      department: newWorkload.department,
      weeklyHours: newWorkload.weeklyHours,
      overtimeHours: newWorkload.overtimeHours,
      overtime25: newWorkload.overtime25,
      overtime50: newWorkload.overtime50,
      overtime100: newWorkload.overtime100,
      nightHours: newWorkload.nightHours,
      status: newWorkload.status
    };

    try {
      const response = await fetch('/api/workloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur ajout');
      }
      
      const successMsg = `Charge de travail ajoutée avec succès pour ${newWorkload.name}`;
      sessionStorage.setItem('successMessage', successMsg);
      
      setShowAddModal(false);
      setSelectedEmployee(null);
      setNewWorkload({
        employeeId: '',
        name: '',
        department: '',
        weeklyHours: 0,
        overtimeHours: 0,
        overtime25: 0,
        overtime50: 0,
        overtime100: 0,
        nightHours: 0,
        status: 'Normal'
      });
      
      window.location.reload();
      
    } catch (err: any) {
      setToastMessage(`❌ Erreur lors de l'ajout: ${err.message}`);
    }
  };

  // ========== EDIT WORKLOAD ==========
  const handleEditClick = (workload: EmployeeWorkload) => {
    setEditingWorkload(workload);
    setEditForm({
      employeeId: workload.employeeId || '',
      name: workload.name,
      department: workload.department,
      weeklyHours: workload.weeklyHours,
      overtimeHours: workload.overtimeHours,
      overtime25: workload.overtime25 || 0,
      overtime50: workload.overtime50 || 0,
      overtime100: workload.overtime100 || 0,
      nightHours: workload.nightHours || 0,
      status: workload.status,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingWorkload) return;
    
    const payload = {
      name: editForm.name,
      department: editForm.department,
      weeklyHours: editForm.weeklyHours,
      overtimeHours: editForm.overtimeHours,
      overtime25: editForm.overtime25,
      overtime50: editForm.overtime50,
      overtime100: editForm.overtime100,
      nightHours: editForm.nightHours,
      status: editForm.status,
    };

    try {
      const response = await fetch(`/api/workloads/${editingWorkload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Erreur modification');
      
      sessionStorage.setItem('successMessage', `Charge de travail modifiée avec succès pour ${editForm.name}`);
      
      setShowEditModal(false);
      setEditingWorkload(null);
      
      window.location.reload();
      
    } catch (err) {
      setToastMessage("❌ Erreur lors de la modification");
    }
  };

  

  // ========== EXPORT CSV ==========
  const handleExport = () => {
    if (workloads.length === 0) {
      setToastMessage("Aucune donnée à exporter");
      return;
    }
    const headers = ['ID Employé', 'Name', 'Department', 'H. T', '25 %', '50 %', '100 %', 'H. NUIT', 'Total Overtime', 'Status'];
    const rows = workloads.map(w => [
      w.employeeId || '',
      w.name || '',
      w.department || '',
      w.weeklyHours || 0,
      w.overtime25 || 0,
      w.overtime50 || 0,
      w.overtime100 || 0,
      w.nightHours || 0,
      w.overtimeHours || 0,
      w.status || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workload_report.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage("Rapport exporté avec succès");
  };

  // ========== CALCULATIONS ==========
  const avgWeeklyHours = workloads.length > 0 
    ? workloads.reduce((sum, w) => sum + w.weeklyHours, 0) / workloads.length 
    : 0;
  const totalOvertime = workloads.reduce((sum, w) => sum + w.overtimeHours, 0);
  const burnoutRisk = workloads.filter(w => w.status === 'High' || w.status === 'Critical').length;
  const exceedingThreshold = workloads.filter(w => w.overtimeHours > 45).length;

  const departmentData = workloads.reduce((acc: any[], curr) => {
    const existing = acc.find(d => d.department === curr.department);
    if (existing) {
      existing.avgWeeklyHours = (existing.avgWeeklyHours + curr.weeklyHours) / 2;
    } else {
      acc.push({ department: curr.department, avgWeeklyHours: curr.weeklyHours });
    }
    return acc;
  }, []);

  const overtimeTrends = [
    { month: 'Jan', overtime: 42 }, { month: 'Fév', overtime: 38 },
    { month: 'Mar', overtime: 45 }, { month: 'Avr', overtime: 52 },
    { month: 'Mai', overtime: 58 }, { month: 'Juin', overtime: 63 },
    { month: 'Juil', overtime: 70 }, { month: 'Aoû', overtime: 68 },
    { month: 'Sep', overtime: 72 },
  ];

  const heatmapData = workloads.reduce((acc: any[], curr) => {
    const existing = acc.find(h => h.department === curr.department);
    if (existing) {
      existing.workload = (existing.workload + curr.weeklyHours) / 2;
    } else {
      let risk = 'low';
      if (curr.weeklyHours >= 50) risk = 'critical';
      else if (curr.weeklyHours >= 45) risk = 'high';
      else if (curr.weeklyHours >= 40) risk = 'medium';
      acc.push({ department: curr.department, workload: curr.weeklyHours, risk });
    }
    return acc;
  }, []);

  const departments = ['All departments', ...new Set(workloads.map(w => w.department).filter(Boolean))];
  
  const filteredWorkloads = workloads.filter(w => {
    if (!w) return false;
    const searchLower = (searchTerm || '').toLowerCase();
    const matchSearch = (w.name || '').toLowerCase().includes(searchLower) ||
                        (w.department || '').toLowerCase().includes(searchLower) ||
                        (w.employeeId || '').toLowerCase().includes(searchLower);
    const matchDept = departmentFilter === 'All departments' || w.department === departmentFilter;
    return matchSearch && matchDept;
  });

  const getStatusColor = (status: WorkloadStatus): string => {
    switch (status) {
      case 'Normal': return '#10b981';
      case 'High': return '#f59e0b';
      case 'Critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Calcul automatique du total overtime
  const calculateTotalOvertime = (overtime25: number, overtime50: number, overtime100: number, nightHours: number) => {
    return (overtime25 || 0) + (overtime50 || 0) + (overtime100 || 0) + (nightHours || 0);
  };

  if (loading) return <div style={{ marginLeft: '260px', padding: '2rem' }}>Chargement des charges de travail...</div>;
  if (error) return <div style={{ color: 'red', marginLeft: '260px', padding: '2rem' }}>{error}</div>;

  return (
    <div>
      <Navbar />
      <div className="workload-page">
        <div className="page-header">
          <h1>Heure Supplémentaire</h1>
          <p>Suivre la charge de travail des employés</p>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}

        {/* KPI Cards */}
        <div className="kpi-cards">
          <div className="kpi-card">
            <div className="kpi-title">Avg hours</div>
            <div className="kpi-value">{avgWeeklyHours.toFixed(1)} h</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Total HeureSupp</div>
            <div className="kpi-value">{totalOvertime} h</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Exceeding threshold (45h)</div>
            <div className="kpi-value">{exceedingThreshold}</div>
            <div className="kpi-sub">employees</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Burnout risk</div>
            <div className="kpi-value">{burnoutRisk}</div>
            <div className="kpi-sub">employees flagged</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <button className="btn-add" onClick={() => setShowAddModal(true)}>➕ Add workload</button>
          <button className="btn-export" onClick={handleExport}>📤 Export report</button>
        </div>

        {/* Table - WITHOUT Actions column */}
        <div className="table-section">
          <div className="table-header">
            <h2>Workload Overview</h2>
            <div className="filters">
              <input type="text" placeholder="Search by name, dept or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="table-container">
            <table className="workload-table">
              <thead>
                <tr>
                  <th>ID Employé</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>H. T</th>
                  <th>25 %</th>
                  <th>50 %</th>
                  <th>100 %</th>
                  <th>H. NUIT</th>
                  <th>Total overtime</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkloads.map(work => (
                  <tr key={work.id}>
                    <td>{work.employeeId || '-'}</td>
                    <td>{work.name}</td>
                    <td>{work.department}</td>
                    <td>{work.weeklyHours}</td>
                    <td>{work.overtime25 || 0}</td>
                    <td>{work.overtime50 || 0}</td>
                    <td>{work.overtime100 || 0}</td>
                    <td>{work.nightHours || 0}</td>
                    <td>{work.overtimeHours}</td>
                    <td>
                      <span className="status-badge" style={{backgroundColor: getStatusColor(work.status), color: 'white'}}>
                        {work.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredWorkloads.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem' }}>
                      Aucune charge de travail trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="chart-card">
            <h3>HeureSUPP par department (avg weekly hours)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgWeeklyHours" fill="#8884d8" name="Avg hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3>HeureSupp trend (last 9 months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={overtimeTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="overtime" stroke="#f59e0b" name="Overtime hours" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap */}
        <div className="heatmap-section">
          <h3>Équipes avec charge excessive</h3>
          <div className="heatmap-grid">
            {heatmapData.map(item => (
              <div key={item.department} className={`heatmap-cell risk-${item.risk}`}>
                <strong>{item.department}</strong><br />{item.workload} h/week
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="ai-insights">
          <h3>🤖 AI Insights</h3>
          <ul>
            <li>🔴 <strong>At-risk employees:</strong> {(() => {
              const atRiskCount = workloads.filter(w => w.status === 'Critical' || w.overtimeHours > 15).length;
              if (atRiskCount === 0) return 'Aucun employé à risque détecté.';
              if (atRiskCount === 1) return '1 employé présente un risque élevé. Une attention particulière est recommandée.';
              return `${atRiskCount} employés présentent un risque élevé. Une action immédiate est recommandée.`;
            })()}</li>
            <li>⚠️ <strong>Workload redistribution</strong> needed for Sales and Finance departments.</li>
            <li>📅 <strong>Flexible scheduling</strong> recommended for teams exceeding 48h/week.</li>
          </ul>
        </div>
      </div>

      {/* Add Modal with Searchable Employee Selector (like AbsenceManagement) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2> Ajouter une charge de travail</h2>
            
            {/* Searchable Employee Select - exactly like AbsenceManagement */}
            <div className="form-group" ref={dropdownRef}>
              <div className="searchable-select">
                <div 
                  className="select-input"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {selectedEmployee ? (
                    <div className="selected-employee">
                      <span className="emp-name">{selectedEmployee.nom} {selectedEmployee.prenom}</span>
                      <span className="emp-id">Matricule: {selectedEmployee.matricule}</span>
                      <span className="emp-dept">- {selectedEmployee.departement}</span>
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
                    <span className="placeholder">Search by name, matricule, or department...</span>
                  )}
                  <span className="dropdown-arrow">▼</span>
                </div>
                
                {isDropdownOpen && (
                  <div className="dropdown-list">
                    <input
                      type="text"
                      className="dropdown-search"
                      placeholder="Type name, matricule to search..."
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
                            <div className="item-name">{emp.nom} {emp.prenom}</div>
                            <div className="item-details">
                              <span className="item-id">Matricule: {emp.matricule}</span>
                              <span className="item-dept">{emp.departement}</span>
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
                  <span className="info-label">Département:</span>
                  <span className="info-value">{newWorkload.department || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">ID Employé:</span>
                  <span className="info-value">{newWorkload.employeeId || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Matricule:</span>
                  <span className="info-value">{selectedEmployee.matricule || '-'}</span>
                </div>
              </>
            )}

            <hr className="separator" />

            {/* Workload Form */}
            <div className="form-row">
              <div className="form-group">
                <label>Heures hebdomadaires (H.T)</label>
                <input 
                  type="number" 
                  placeholder="Heures normales"
                  value={newWorkload.weeklyHours} 
                  onChange={e => setNewWorkload({...newWorkload, weeklyHours: Number(e.target.value)})} 
                />
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select 
                  value={newWorkload.status} 
                  onChange={e => setNewWorkload({...newWorkload, status: e.target.value as WorkloadStatus})}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Heures supplémentaires 25%</label>
                <input 
                  type="number" 
                  placeholder="Heures à 25%"
                  value={newWorkload.overtime25} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    setNewWorkload(prev => ({
                      ...prev, 
                      overtime25: val,
                      overtimeHours: calculateTotalOvertime(val, prev.overtime50, prev.overtime100, prev.nightHours)
                    }));
                  }} 
                />
              </div>
              <div className="form-group">
                <label>Heures supplémentaires 50%</label>
                <input 
                  type="number" 
                  placeholder="Heures à 50%"
                  value={newWorkload.overtime50} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    setNewWorkload(prev => ({
                      ...prev, 
                      overtime50: val,
                      overtimeHours: calculateTotalOvertime(prev.overtime25, val, prev.overtime100, prev.nightHours)
                    }));
                  }} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Heures supplémentaires 100%</label>
                <input 
                  type="number" 
                  placeholder="Heures à 100%"
                  value={newWorkload.overtime100} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    setNewWorkload(prev => ({
                      ...prev, 
                      overtime100: val,
                      overtimeHours: calculateTotalOvertime(prev.overtime25, prev.overtime50, val, prev.nightHours)
                    }));
                  }} 
                />
              </div>
              <div className="form-group">
                <label>Heures de nuit</label>
                <input 
                  type="number" 
                  placeholder="Heures de nuit"
                  value={newWorkload.nightHours} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    setNewWorkload(prev => ({
                      ...prev, 
                      nightHours: val,
                      overtimeHours: calculateTotalOvertime(prev.overtime25, prev.overtime50, prev.overtime100, val)
                    }));
                  }} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Total heures supplémentaires</label>
                <input 
                  type="number" 
                  placeholder="Total heures sup"
                  value={newWorkload.overtimeHours} 
                  onChange={e => setNewWorkload({...newWorkload, overtimeHours: Number(e.target.value)})} 
                />
                <small className="field-hint">Calculé automatiquement à partir des types d'heures</small>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => {
                setShowAddModal(false);
                setSelectedEmployee(null);
                setEmployeeSearchTerm('');
                setNewWorkload({
                  employeeId: '',
                  name: '',
                  department: '',
                  weeklyHours: 0,
                  overtimeHours: 0,
                  overtime25: 0,
                  overtime50: 0,
                  overtime100: 0,
                  nightHours: 0,
                  status: 'Normal'
                });
              }}>Annuler</button>
              <button className="btn-submit" onClick={handleAdd}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingWorkload && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>✏️ Modifier la charge de travail</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nom complet</label>
                <input 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Département</label>
                <input 
                  value={editForm.department} 
                  onChange={e => setEditForm({...editForm, department: e.target.value})} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Heures hebdomadaires (H.T)</label>
                <input 
                  type="number" 
                  value={editForm.weeklyHours} 
                  onChange={e => setEditForm({...editForm, weeklyHours: Number(e.target.value)})} 
                />
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select 
                  value={editForm.status} 
                  onChange={e => setEditForm({...editForm, status: e.target.value as WorkloadStatus})}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Heures supplémentaires 25%</label>
                <input 
                  type="number" 
                  value={editForm.overtime25} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    setEditForm(prev => ({
                      ...prev, 
                      overtime25: val,
                      overtimeHours: calculateTotalOvertime(val, prev.overtime50, prev.overtime100, prev.nightHours)
                    }));
                  }} 
                />
              </div>
              <div className="form-group">
                <label>Heures supplémentaires 50%</label>
                <input 
                  type="number" 
                  value={editForm.overtime50} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    setEditForm(prev => ({
                      ...prev, 
                      overtime50: val,
                      overtimeHours: calculateTotalOvertime(prev.overtime25, val, prev.overtime100, prev.nightHours)
                    }));
                  }} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Heures supplémentaires 100%</label>
                <input 
                  type="number" 
                  value={editForm.overtime100} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    setEditForm(prev => ({
                      ...prev, 
                      overtime100: val,
                      overtimeHours: calculateTotalOvertime(prev.overtime25, prev.overtime50, val, prev.nightHours)
                    }));
                  }} 
                />
              </div>
              <div className="form-group">
                <label>Heures de nuit</label>
                <input 
                  type="number" 
                  value={editForm.nightHours} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    setEditForm(prev => ({
                      ...prev, 
                      nightHours: val,
                      overtimeHours: calculateTotalOvertime(prev.overtime25, prev.overtime50, prev.overtime100, val)
                    }));
                  }} 
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

export default WorkloadManagement;
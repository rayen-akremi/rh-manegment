import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import Navbar from './Navbar';
import '../style/WorkloadManagement.css';

type WorkloadStatus = 'Normal' | 'High' | 'Critical';

interface EmployeeWorkload {
  id: string;
  name: string;
  department: string;
  weeklyHours: number;
  overtimeHours: number;
  status: WorkloadStatus;
}

interface DepartmentWorkload {
  department: string;
  avgWeeklyHours: number;
}

interface OvertimeTrend {
  month: string;
  overtime: number;
}

// Données initiales des employés
const initialEmployees: EmployeeWorkload[] = [
  { id: '1', name: 'Sophia Rossi', department: 'Engineering', weeklyHours: 42, overtimeHours: 5, status: 'Normal' },
  { id: '2', name: 'Lucas Bernard', department: 'Sales', weeklyHours: 48, overtimeHours: 12, status: 'High' },
  { id: '3', name: 'Emma Wilson', department: 'Marketing', weeklyHours: 38, overtimeHours: 2, status: 'Normal' },
  { id: '4', name: 'John Doe', department: 'Finance', weeklyHours: 52, overtimeHours: 18, status: 'Critical' },
  { id: '5', name: 'Maya Robinson', department: 'Engineering', weeklyHours: 45, overtimeHours: 8, status: 'High' },
  { id: '6', name: 'Ali Ben Salah', department: 'Product', weeklyHours: 36, overtimeHours: 1, status: 'Normal' },
  { id: '7', name: 'Clara Dupont', department: 'Support', weeklyHours: 50, overtimeHours: 15, status: 'Critical' },
  { id: '8', name: 'David Mercier', department: 'Sales', weeklyHours: 44, overtimeHours: 9, status: 'High' },
];

// Données pour le bar chart (moyenne par département)
const departmentData: DepartmentWorkload[] = [
  { department: 'Engineering', avgWeeklyHours: 43.5 },
  { department: 'Sales', avgWeeklyHours: 46 },
  { department: 'Marketing', avgWeeklyHours: 38 },
  { department: 'Finance', avgWeeklyHours: 52 },
  { department: 'Product', avgWeeklyHours: 36 },
  { department: 'Support', avgWeeklyHours: 50 },
];

// Données pour le line chart (tendance overtime)
const overtimeTrends: OvertimeTrend[] = [
  { month: 'Jan', overtime: 42 }, { month: 'Fév', overtime: 38 },
  { month: 'Mar', overtime: 45 }, { month: 'Avr', overtime: 52 },
  { month: 'Mai', overtime: 58 }, { month: 'Juin', overtime: 63 },
  { month: 'Juil', overtime: 70 }, { month: 'Aoû', overtime: 68 },
  { month: 'Sep', overtime: 72 },
];

// Données pour la heatmap (départements avec niveau de risque et heures)
const heatmapData = [
  { department: 'Engineering', workload: 43, risk: 'medium' },
  { department: 'Sales', workload: 48, risk: 'high' },
  { department: 'Marketing', workload: 38, risk: 'low' },
  { department: 'Finance', workload: 52, risk: 'critical' },
  { department: 'Product', workload: 36, risk: 'low' },
  { department: 'Support', workload: 50, risk: 'high' },
];

const getStatusColor = (status: WorkloadStatus): string => {
  switch (status) {
    case 'Normal': return '#10b981';
    case 'High': return '#f59e0b';
    case 'Critical': return '#ef4444';
    default: return '#6b7280';
  }
};

const WorkloadManagement: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWorkload[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWorkload | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '', department: '', weeklyHours: 40, overtimeHours: 0, status: 'Normal' as WorkloadStatus
  });
  const [editForm, setEditForm] = useState({
    name: '', department: '', weeklyHours: 40, overtimeHours: 0, status: 'Normal' as WorkloadStatus
  });

  // KPI
  const avgWeeklyHours = employees.reduce((sum, e) => sum + e.weeklyHours, 0) / employees.length;
  const totalOvertime = employees.reduce((sum, e) => sum + e.overtimeHours, 0);
  const burnoutRisk = employees.filter(e => e.status === 'High' || e.status === 'Critical').length;

  const departments = ['All departments', ...new Set(employees.map(e => e.department))];

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = departmentFilter === 'All departments' || emp.department === departmentFilter;
    return matchSearch && matchDept;
  });

  const handleAdd = () => {
    const newId = (Math.max(...employees.map(e => parseInt(e.id)), 0) + 1).toString();
    const newEmp: EmployeeWorkload = { id: newId, ...newEmployee };
    setEmployees([...employees, newEmp]);
    setShowAddModal(false);
    setNewEmployee({ name: '', department: '', weeklyHours: 40, overtimeHours: 0, status: 'Normal' });
  };

  const handleEditClick = (emp: EmployeeWorkload) => {
    setEditingEmployee(emp);
    setEditForm({
      name: emp.name,
      department: emp.department,
      weeklyHours: emp.weeklyHours,
      overtimeHours: emp.overtimeHours,
      status: emp.status,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingEmployee) return;
    const updated: EmployeeWorkload = { ...editingEmployee, ...editForm };
    setEmployees(employees.map(e => e.id === editingEmployee.id ? updated : e));
    setShowEditModal(false);
    setEditingEmployee(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this workload record?')) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Department', 'Weekly Hours', 'Overtime Hours', 'Status'];
    const rows = filteredEmployees.map(e => [e.name, e.department, e.weeklyHours, e.overtimeHours, e.status]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workload_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Navbar />
      <div className="workload-page">
        <div className="page-header">
          <h1>Workload Management</h1>
          <p>Monitor employee workload, detect risks of burnout, and balance tasks across teams.</p>
        </div>

        {/* KPI Cards */}
        <div className="kpi-cards">
          <div className="kpi-card">
            <div className="kpi-title">Avg weekly hours</div>
            <div className="kpi-value">{avgWeeklyHours.toFixed(1)} h</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Total overtime</div>
            <div className="kpi-value">{totalOvertime} h</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Exceeding threshold (45h)</div>
            <div className="kpi-value">{employees.filter(e => e.overtimeHours > 45).length}</div>
            <div className="kpi-sub">employees</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Burnout risk</div>
            <div className="kpi-value">{burnoutRisk}</div>
            <div className="kpi-sub">employees flagged</div>
          </div>
        </div>

        {/* Toolbar buttons */}
        <div className="toolbar">
          <button className="btn-add" onClick={() => setShowAddModal(true)}>➕ Add workload</button>
          <button className="btn-export" onClick={handleExport}>📤 Export report</button>
        </div>

        {/* Workload Table */}
        <div className="table-section">
          <div className="table-header">
            <h2>Workload Overview</h2>
            <div className="filters">
              <input type="text" placeholder="Search by name or dept" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="table-container">
            <table className="workload-table">
              <thead>
                <tr>
                  <th>Name</th><th>Department</th><th>Weekly hours</th><th>Overtime hours</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.name}</td><td>{emp.department}</td><td>{emp.weeklyHours}</td><td>{emp.overtimeHours}</td>
                    <td><span className="status-badge" style={{backgroundColor: getStatusColor(emp.status), color: 'white'}}>{emp.status}</span></td>
                    <td className="actions">
                      <button className="edit-btn" onClick={() => handleEditClick(emp)}>✏️</button>
                      <button className="delete-btn" onClick={() => handleDelete(emp.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="chart-card">
            <h3>Workload by department (avg weekly hours)</h3>
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
            <h3>Overtime trends (last 9 months)</h3>
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

        {/* Heatmap - tous les départements sur une ligne, même taille */}
        <div className="heatmap-section">
          <h3>🔥 Heatmap: Teams with excessive workload</h3>
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
            <li>🔴 <strong>At-risk employees:</strong> {employees.filter(e => e.status === 'Critical' || e.overtimeHours > 15).map(e => e.name).join(', ') || 'None'}</li>
            <li>⚠️ <strong>Workload redistribution</strong> needed for Sales and Finance departments.</li>
            <li>📅 <strong>Flexible scheduling</strong> recommended for teams exceeding 48h/week.</li>
          </ul>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add workload record</h2>
            <div className="form-row"><input placeholder="Name" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} /></div>
            <div className="form-row"><input placeholder="Department" value={newEmployee.department} onChange={e => setNewEmployee({...newEmployee, department: e.target.value})} /></div>
            <div className="form-row"><label>Weekly hours</label><input type="number" value={newEmployee.weeklyHours} onChange={e => setNewEmployee({...newEmployee, weeklyHours: Number(e.target.value)})} /></div>
            <div className="form-row"><label>Overtime hours</label><input type="number" value={newEmployee.overtimeHours} onChange={e => setNewEmployee({...newEmployee, overtimeHours: Number(e.target.value)})} /></div>
            <div className="form-row"><label>Status</label>
              <select value={newEmployee.status} onChange={e => setNewEmployee({...newEmployee, status: e.target.value as WorkloadStatus})}>
                <option>Normal</option><option>High</option><option>Critical</option>
              </select>
            </div>
            <div className="modal-actions"><button onClick={() => setShowAddModal(false)}>Cancel</button><button onClick={handleAdd}>Add</button></div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingEmployee && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit workload</h2>
            <div className="form-row"><input placeholder="Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
            <div className="form-row"><input placeholder="Department" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} /></div>
            <div className="form-row"><label>Weekly hours</label><input type="number" value={editForm.weeklyHours} onChange={e => setEditForm({...editForm, weeklyHours: Number(e.target.value)})} /></div>
            <div className="form-row"><label>Overtime hours</label><input type="number" value={editForm.overtimeHours} onChange={e => setEditForm({...editForm, overtimeHours: Number(e.target.value)})} /></div>
            <div className="form-row"><label>Status</label>
              <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as WorkloadStatus})}>
                <option>Normal</option><option>High</option><option>Critical</option>
              </select>
            </div>
            <div className="modal-actions"><button onClick={() => setShowEditModal(false)}>Cancel</button><button onClick={handleSaveEdit}>Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkloadManagement;
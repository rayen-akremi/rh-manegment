import React, { useState, useEffect } from 'react';
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

const WorkloadManagement: React.FC = () => {
  const [workloads, setWorkloads] = useState<EmployeeWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorkload, setEditingWorkload] = useState<EmployeeWorkload | null>(null);
  const [newWorkload, setNewWorkload] = useState({
    employeeId: '',
    name: '',
    department: '',
    weeklyHours: 40,
    overtimeHours: 0,
    status: 'Normal' as WorkloadStatus
  });
  const [editForm, setEditForm] = useState({
    employeeId: '',
    name: '',
    department: '',
    weeklyHours: 40,
    overtimeHours: 0,
    status: 'Normal' as WorkloadStatus
  });

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
        name: item.name || '',
        department: item.department || '',
        weeklyHours: item.weeklyHours || 0,
        overtimeHours: item.overtimeHours || 0,
        overtime25: 0,
        overtime50: 0,
        overtime100: 0,
        nightHours: 0,
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
    const refresh = () => fetchWorkloads();
    window.addEventListener('monthly-recap-imported', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('monthly-recap-imported', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // ========== ADD WORKLOAD ==========
  const handleAdd = async () => {
    if (!newWorkload.employeeId.trim()) { alert("L'ID employé est requis"); return; }
    if (!newWorkload.name.trim()) { alert("Le nom est requis"); return; }
    if (!newWorkload.department.trim()) { alert("Le département est requis"); return; }
    if (newWorkload.weeklyHours < 0) { alert("Les heures hebdomadaires doivent être >= 0"); return; }
    if (newWorkload.overtimeHours < 0) { alert("Les heures supplémentaires doivent être >= 0"); return; }

    const payload = {
      workload_id: `WL${Date.now()}`,
      employee_id: newWorkload.employeeId,
      name: newWorkload.name,
      department: newWorkload.department,
      weeklyHours: newWorkload.weeklyHours,
      overtimeHours: newWorkload.overtimeHours,
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
      
      await fetchWorkloads();
      setShowAddModal(false);
      setNewWorkload({
        employeeId: '',
        name: '',
        department: '',
        weeklyHours: 40,
        overtimeHours: 0,
        status: 'Normal'
      });
    } catch (err: any) {
      alert(`Erreur lors de l'ajout: ${err.message}`);
    }
  };

  // ========== EDIT WORKLOAD ==========
  const handleEditClick = (workload: EmployeeWorkload) => {
    setEditingWorkload(workload);
    setEditForm({
      employeeId: '',
      name: workload.name,
      department: workload.department,
      weeklyHours: workload.weeklyHours,
      overtimeHours: workload.overtimeHours,
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
      status: editForm.status,
    };

    try {
      const response = await fetch(`/api/workloads/${editingWorkload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Erreur modification');
      await fetchWorkloads();
      setShowEditModal(false);
      setEditingWorkload(null);
    } catch (err) {
      alert('Erreur lors de la modification');
    }
  };

  // ========== DELETE WORKLOAD ==========
  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet enregistrement ?')) return;
    try {
      const response = await fetch(`/api/workloads/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur suppression');
      await fetchWorkloads();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // ========== EXPORT CSV ==========
  const handleExport = () => {
    if (workloads.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    const headers = ['Name', 'Department', 'H. T', '25 %', '50 %', '100 %', 'H. NUIT', 'Total Overtime', 'Status'];
    const rows = workloads.map(w => [
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
                        (w.department || '').toLowerCase().includes(searchLower);
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

  if (loading) return <div style={{ marginLeft: '260px', padding: '2rem' }}>Chargement des charges de travail...</div>;
  if (error) return <div style={{ color: 'red', marginLeft: '260px', padding: '2rem' }}>{error}</div>;

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

        {/* Table */}
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
                  <th>Name</th>
                  <th>Department</th>
                  <th>H. T</th>
                  <th>25 %</th>
                  <th>50 %</th>
                  <th>100 %</th>
                  <th>H. NUIT</th>
                  <th>Total overtime</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkloads.map(work => (
                  <tr key={work.id}>
                    <td>{work.name}</td>
                    <td>{work.department}</td>
                    <td>{work.weeklyHours}</td>
                    <td title="Overtime at +25% rate">{work.overtime25 || 0}</td>
                    <td title="Overtime at +50% rate">{work.overtime50 || 0}</td>
                    <td title="Overtime at +100% rate">{work.overtime100 || 0}</td>
                    <td>{work.nightHours || 0}</td>
                    <td>{work.overtimeHours}</td>
                    <td>
                      <span className="status-badge" style={{backgroundColor: getStatusColor(work.status), color: 'white'}}>
                        {work.status}
                      </span>
                    </td>
                    <td className="actions">
                      {work.fromRecap ? (
                        <span className="kpi-sub">Imported</span>
                      ) : (
                        <>
                          <button className="edit-btn" onClick={() => handleEditClick(work)}>✏️</button>
                          <button className="delete-btn" onClick={() => handleDelete(work.id)}>🗑️</button>
                        </>
                      )}
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

        {/* Heatmap */}
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
            <li>🔴 <strong>At-risk employees:</strong> {workloads.filter(w => w.status === 'Critical' || w.overtimeHours > 15).map(w => w.name).join(', ') || 'None'}</li>
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
            <div className="form-row">
              <div className="form-group">
                <label>Employee ID</label>
                <input 
                  type="text" 
                  placeholder="e.g., EMP001" 
                  value={newWorkload.employeeId} 
                  onChange={e => setNewWorkload({...newWorkload, employeeId: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input 
                  placeholder="Name" 
                  value={newWorkload.name} 
                  onChange={e => setNewWorkload({...newWorkload, name: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <input 
                  placeholder="Department" 
                  value={newWorkload.department} 
                  onChange={e => setNewWorkload({...newWorkload, department: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Weekly hours</label>
                <input 
                  type="number" 
                  value={newWorkload.weeklyHours} 
                  onChange={e => setNewWorkload({...newWorkload, weeklyHours: Number(e.target.value)})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Overtime hours</label>
                <input 
                  type="number" 
                  value={newWorkload.overtimeHours} 
                  onChange={e => setNewWorkload({...newWorkload, overtimeHours: Number(e.target.value)})} 
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={newWorkload.status} 
                  onChange={e => setNewWorkload({...newWorkload, status: e.target.value as WorkloadStatus})}
                >
                  <option>Normal</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleAdd}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingWorkload && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit workload</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input 
                  value={editForm.department} 
                  onChange={e => setEditForm({...editForm, department: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Weekly hours</label>
                <input 
                  type="number" 
                  value={editForm.weeklyHours} 
                  onChange={e => setEditForm({...editForm, weeklyHours: Number(e.target.value)})} 
                />
              </div>
              <div className="form-group">
                <label>Overtime hours</label>
                <input 
                  type="number" 
                  value={editForm.overtimeHours} 
                  onChange={e => setEditForm({...editForm, overtimeHours: Number(e.target.value)})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={editForm.status} 
                  onChange={e => setEditForm({...editForm, status: e.target.value as WorkloadStatus})}
                >
                  <option>Normal</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkloadManagement;

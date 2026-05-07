import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import '../style/Employee.css';

type EmployeeStatus = 'Actif' | 'En congé' | 'Absent';

interface EmployeeData {
  id: string;
  matricule: string;
  name: string;
  department: string;
  position: string;
  age: number;
  seniority: number;
  status: EmployeeStatus;
  joinDate?: string;
  regime?: string;
  workforceType?: string;
  gender?: string;
  htHours?: number;
  overtime25?: number;
  overtime50?: number;
  overtime100?: number;
  nightHours?: number;
  absenceDays?: number;
  absenceHours?: number;
  fromRecap?: boolean;
}

const Employee: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous les statuts');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);

  const [newEmployee, setNewEmployee] = useState({
    prenom: '',
    nom: '',
    id: '',
    matricule: '',
    position: '',
    department: '',
    status: 'Actif' as EmployeeStatus,
    age: 25,
    joinDate: '',
  });

  const [editForm, setEditForm] = useState({
    prenom: '',
    nom: '',
    id: '',
    matricule: '',
    position: '',
    department: '',
    status: 'Actif' as EmployeeStatus,
    age: 25,
    joinDate: '',
  });

  // ========== FETCH EMPLOYEES ==========
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [response, recapResponse] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/monthly-recap')
      ]);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const recapData = recapResponse.ok ? await recapResponse.json() : [];
      
      const formatted: EmployeeData[] = (data || []).map((emp: any) => ({
        id: emp.employee_id || '',
        matricule: emp.matricule || '',
        name: `${emp.prenom || ''} ${emp.nom || ''}`.trim(),
        department: emp.departement || '',
        position: emp.poste || '',
        age: emp.age || 0,
        seniority: 0,
        status: emp.status === 'Actif' ? 'Actif' : (emp.status === 'En congé' ? 'En congé' : 'Absent'),
        joinDate: emp.joinDate ? emp.joinDate.split('T')[0] : '',
      }));
      
      const recapEmployees: EmployeeData[] = (recapData || []).map((item: any) => ({
        id: item.matricule || '',
        matricule: item.matricule || '',
        name: item.employeeName || '',
        department: item.department || '',
        position: item.regime || '',
        age: 0,
        seniority: 0,
        status: 'Actif',
        joinDate: item.hireDate ? item.hireDate.split('T')[0] : '',
        regime: item.regime || '',
        workforceType: item.workforceType || '',
        gender: item.gender || '',
        htHours: item.htHours || 0,
        overtime25: item.overtime25 || 0,
        overtime50: item.overtime50 || 0,
        overtime100: item.overtime100 || 0,
        nightHours: item.nightHours || 0,
        absenceDays: item.absenceDays || 0,
        absenceHours: item.absenceHours || 0,
        fromRecap: true
      }));

      setEmployees(recapEmployees.length ? recapEmployees : formatted);
      setError('');
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les employés");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    const refresh = () => fetchEmployees();
    window.addEventListener('monthly-recap-imported', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('monthly-recap-imported', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // ========== ADD EMPLOYEE ==========
  const handleAddEmployee = async () => {
    if (!newEmployee.prenom.trim()) { alert("Le prénom est requis"); return; }
    if (!newEmployee.nom.trim()) { alert("Le nom est requis"); return; }
    if (!newEmployee.id.trim()) { alert("L'ID employé est requis"); return; }
    if (!newEmployee.department.trim()) { alert("Le département est requis"); return; }
    if (!newEmployee.position.trim()) { alert("Le poste est requis"); return; }
    if (newEmployee.age < 16) { alert("L'âge doit être au moins 16 ans"); return; }

    const email = `${newEmployee.prenom.toLowerCase()}.${newEmployee.nom.toLowerCase()}.${newEmployee.id.toLowerCase()}@rh.com`.replace(/[^a-z0-9.@]/g, '');

    const payload = {
      employee_id: newEmployee.id,
      matricule: newEmployee.matricule,
      prenom: newEmployee.prenom,
      nom: newEmployee.nom,
      email,
      age: newEmployee.age,
      departement: newEmployee.department,
      poste: newEmployee.position,
      status: newEmployee.status,
      joinDate: newEmployee.joinDate ? new Date(newEmployee.joinDate) : undefined,
    };

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur serveur');
      await fetchEmployees();
      setShowAddModal(false);
      setNewEmployee({
        prenom: '', nom: '', id: '', matricule: '', position: '', department: '', status: 'Actif',
        age: 25, joinDate: '',
      });
    } catch (err: any) {
      alert(`Erreur lors de l'ajout: ${err.message}`);
    }
  };

  // ========== EDIT EMPLOYEE ==========
  const handleEditClick = (emp: EmployeeData) => {
    const nameParts = emp.name.split(' ');
    const prenom = nameParts[0] || '';
    const nom = nameParts.slice(1).join(' ') || '';
    
    setEditingEmployee(emp);
    setEditForm({
      prenom: prenom,
      nom: nom,
      id: emp.id || '',
      matricule: emp.matricule || '',
      position: emp.position || '',
      department: emp.department || '',
      status: emp.status || 'Actif',
      age: emp.age || 25,
      joinDate: emp.joinDate || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;
    
    const payload = {
      matricule: editForm.matricule,
      prenom: editForm.prenom,
      nom: editForm.nom,
      age: editForm.age,
      departement: editForm.department,
      poste: editForm.position,
      status: editForm.status,
      joinDate: editForm.joinDate ? new Date(editForm.joinDate) : undefined,
    };
    
    try {
      const res = await fetch(`/api/employees/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message);
      }
      await fetchEmployees();
      setShowEditModal(false);
      setEditingEmployee(null);
    } catch (err: any) {
      alert(`Erreur modification: ${err.message}`);
    }
  };

  // ========== DELETE EMPLOYEE ==========
  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Supprimer cet employé ?')) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchEmployees();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // ========== IMPORT EXCEL ==========
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/monthly-recap/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem('monthlyRecapLastImport', String(Date.now()));
      window.dispatchEvent(new Event('monthly-recap-imported'));
      alert(data.message);
      await fetchEmployees();
    } catch (err: any) {
      alert(`Erreur import: ${err.message}`);
    }
    event.target.value = '';
  };

  // ========== STATISTICS ==========
  const total = employees.length;
  const actifs = employees.filter(e => e.status === 'Actif').length;
  const totalHtHours = employees.reduce((sum, e) => sum + (e.htHours || 0), 0);
  const totalNightHours = employees.reduce((sum, e) => sum + (e.nightHours || 0), 0);

  // ========== SAFE FILTER ==========
  const filteredEmployees = employees.filter(emp => {
    if (!emp) return false;
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (emp.name || '').toLowerCase().includes(searchLower) ||
      (emp.matricule || '').toLowerCase().includes(searchLower) ||
      (emp.position || '').toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'Tous les statuts' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div style={{ marginLeft: '260px', padding: '2rem' }}>Chargement des employés...</div>;
  if (error) return <div style={{ color: 'red', marginLeft: '260px', padding: '2rem' }}>{error}</div>;

  return (
    <div>
      <Navbar />
      <div className="employee-page">
        <div className="page-header">
          <h1>Employés</h1>
          <p className="subtitle">Gestion des employés</p>
        </div>

        <div className="stats-cards">
          <div className="stat-card"><div className="stat-value">{total}</div><div className="stat-label">TOTAL</div></div>
          <div className="stat-card"><div className="stat-value">{actifs}</div><div className="stat-label">ACTIFS</div></div>
          <div className="stat-card"><div className="stat-value">{totalHtHours.toFixed(1)}</div><div className="stat-label">H. T</div></div>
          <div className="stat-card"><div className="stat-value">{totalNightHours.toFixed(1)}</div><div className="stat-label">H. NUIT</div></div>
        </div>

        <div className="toolbar">
          <input
            type="text"
            placeholder="Rechercher par nom, matricule ou poste"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="filters">
            <select className="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>Tous les statuts</option><option>Actif</option><option>En congé</option><option>Absent</option>
            </select>
            <label className="btn-import">
              📂 Importer Récap
              <input type="file" accept=".xlsx,.xls,.ods" onChange={handleImportExcel} hidden />
            </label>
            <button className="btn-add" onClick={() => setShowAddModal(true)}>Ajouter</button>
          </div>
        </div>

        <div className="table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Régime</th>
                <th>Département</th>
                <th>Type d'effectif</th>
                <th>Genre</th>
                <th>Date d'embauche</th>
                <th>H. T</th>
                <th>25 %</th>
                <th>50 %</th>
                <th>100 %</th>
                <th>H. NUIT</th>
                <th>ABS./jour</th>
                <th>Abs. hours</th>
                <th>Matricule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td className="employee-info">
                    <div className="employee-name">{emp.name}</div>
                    <div className="employee-details">{emp.id} - {emp.position}</div>
                    {!emp.fromRecap && <div className="employee-details">{emp.age} ans</div>}
                  </td>
                  <td>{emp.regime || emp.position || '-'}</td>
                  <td>{emp.department}</td>
                  <td>{emp.workforceType || '-'}</td>
                  <td>{emp.gender || '-'}</td>
                  <td>{emp.joinDate || '-'}</td>
                  <td>{emp.htHours || 0}</td>
                  <td>{emp.overtime25 || 0}</td>
                  <td>{emp.overtime50 || 0}</td>
                  <td>{emp.overtime100 || 0}</td>
                  <td>{emp.nightHours || 0}</td>
                  <td>{emp.absenceDays || 0}</td>
                  <td>{emp.absenceHours || 0}</td>
                  <td>{emp.matricule}</td>
                  <td>
                    {emp.fromRecap ? (
                      <span className="employee-details">Imported</span>
                    ) : (
                      <>
                        <button className="action-btn edit" onClick={() => handleEditClick(emp)}>✏️</button>
                        <button className="action-btn delete" onClick={() => handleDeleteEmployee(emp.id)}>🗑️</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={15} style={{ textAlign: 'center', padding: '2rem' }}>Aucun employé trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal with separate Nom field */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add new employee</h2>
            <p>Fill in the details to onboard a new team member.</p>
            <div className="form-row">
              <div className="form-group">
                <label>Prénom (First name)</label>
                <input 
                  type="text" 
                  placeholder="Prénom" 
                  value={newEmployee.prenom} 
                  onChange={e => setNewEmployee({...newEmployee, prenom: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Nom (Last name)</label>
                <input 
                  type="text" 
                  placeholder="Nom" 
                  value={newEmployee.nom} 
                  onChange={e => setNewEmployee({...newEmployee, nom: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Employee ID</label>
                <input 
                  type="text" 
                  placeholder="ID" 
                  value={newEmployee.id} 
                  onChange={e => setNewEmployee({...newEmployee, id: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Matricule</label>
                <input 
                  type="text" 
                  placeholder="Matricule" 
                  value={newEmployee.matricule} 
                  onChange={e => setNewEmployee({...newEmployee, matricule: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Job title</label>
                <input 
                  type="text" 
                  placeholder="Poste" 
                  value={newEmployee.position} 
                  onChange={e => setNewEmployee({...newEmployee, position: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input 
                  type="text" 
                  placeholder="Département" 
                  value={newEmployee.department} 
                  onChange={e => setNewEmployee({...newEmployee, department: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={newEmployee.status} 
                  onChange={e => setNewEmployee({...newEmployee, status: e.target.value as EmployeeStatus})}
                >
                  <option>Actif</option>
                  <option>En congé</option>
                  <option>Absent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Age</label>
                <input 
                  type="number" 
                  value={newEmployee.age} 
                  onChange={e => setNewEmployee({...newEmployee, age: parseInt(e.target.value)})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of joining</label>
                <input 
                  type="date" 
                  value={newEmployee.joinDate} 
                  onChange={e => setNewEmployee({...newEmployee, joinDate: e.target.value})} 
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleAddEmployee}>Add employee</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal with separate Nom field */}
      {showEditModal && editingEmployee && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit employee</h2>
            <p>Modify the details of {editingEmployee.name}.</p>
            <div className="form-row">
              <div className="form-group">
                <label>Prénom (First name)</label>
                <input 
                  type="text" 
                  value={editForm.prenom} 
                  onChange={e => setEditForm({...editForm, prenom: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Nom (Last name)</label>
                <input 
                  type="text" 
                  value={editForm.nom} 
                  onChange={e => setEditForm({...editForm, nom: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Employee ID</label>
                <input value={editForm.id} disabled />
              </div>
              <div className="form-group">
                <label>Matricule</label>
                <input 
                  type="text" 
                  value={editForm.matricule} 
                  onChange={e => setEditForm({...editForm, matricule: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Job title</label>
                <input 
                  type="text" 
                  value={editForm.position} 
                  onChange={e => setEditForm({...editForm, position: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input 
                  type="text" 
                  value={editForm.department} 
                  onChange={e => setEditForm({...editForm, department: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={editForm.status} 
                  onChange={e => setEditForm({...editForm, status: e.target.value as EmployeeStatus})}
                >
                  <option>Actif</option>
                  <option>En congé</option>
                  <option>Absent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Age</label>
                <input 
                  type="number" 
                  value={editForm.age} 
                  onChange={e => setEditForm({...editForm, age: parseInt(e.target.value)})} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of joining</label>
                <input 
                  type="date" 
                  value={editForm.joinDate} 
                  onChange={e => setEditForm({...editForm, joinDate: e.target.value})} 
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

export default Employee;

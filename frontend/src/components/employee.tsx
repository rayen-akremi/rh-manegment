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
  nightHours?: number;
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
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
    regime: '',
    workforceType: '',
    gender: '',
    htHours: 0,
    nightHours: 0,
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
    regime: '',
    workforceType: '',
    gender: '',
    htHours: 0,
    nightHours: 0,
  });

  // Force refresh function
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Gestionnaires d'événements pour le formulaire d'ajout
  const handleNewPrenomChange = (value: string) => {
    setNewEmployee({ ...newEmployee, prenom: value });
  };

  const handleNewNomChange = (value: string) => {
    setNewEmployee({ ...newEmployee, nom: value });
  };

  const handleNewIdChange = (value: string) => {
    setNewEmployee({ ...newEmployee, id: value });
  };

  const handleNewMatriculeChange = (value: string) => {
    setNewEmployee({ ...newEmployee, matricule: value });
  };

  const handleNewPositionChange = (value: string) => {
    setNewEmployee({ ...newEmployee, position: value });
  };

  const handleNewDepartmentChange = (value: string) => {
    setNewEmployee({ ...newEmployee, department: value });
  };

  const handleNewStatusChange = (value: EmployeeStatus) => {
    setNewEmployee({ ...newEmployee, status: value });
  };

  const handleNewAgeChange = (value: number) => {
    setNewEmployee({ ...newEmployee, age: value });
  };

  const handleNewJoinDateChange = (value: string) => {
    setNewEmployee({ ...newEmployee, joinDate: value });
  };

  const handleNewRegimeChange = (value: string) => {
    setNewEmployee({ ...newEmployee, regime: value });
  };

  const handleNewWorkforceTypeChange = (value: string) => {
    setNewEmployee({ ...newEmployee, workforceType: value });
  };

  const handleNewGenderChange = (value: string) => {
    setNewEmployee({ ...newEmployee, gender: value });
  };

  const handleNewHtHoursChange = (value: number) => {
    setNewEmployee({ ...newEmployee, htHours: value });
  };

  const handleNewNightHoursChange = (value: number) => {
    setNewEmployee({ ...newEmployee, nightHours: value });
  };

  // Gestionnaires d'événements pour le formulaire d'édition
  const handleEditPrenomChange = (value: string) => {
    setEditForm({ ...editForm, prenom: value });
  };

  const handleEditNomChange = (value: string) => {
    setEditForm({ ...editForm, nom: value });
  };

  const handleEditMatriculeChange = (value: string) => {
    setEditForm({ ...editForm, matricule: value });
  };

  const handleEditPositionChange = (value: string) => {
    setEditForm({ ...editForm, position: value });
  };

  const handleEditDepartmentChange = (value: string) => {
    setEditForm({ ...editForm, department: value });
  };

  const handleEditStatusChange = (value: EmployeeStatus) => {
    setEditForm({ ...editForm, status: value });
  };

  const handleEditAgeChange = (value: number) => {
    setEditForm({ ...editForm, age: value });
  };

  const handleEditJoinDateChange = (value: string) => {
    setEditForm({ ...editForm, joinDate: value });
  };

  const handleEditRegimeChange = (value: string) => {
    setEditForm({ ...editForm, regime: value });
  };

  const handleEditWorkforceTypeChange = (value: string) => {
    setEditForm({ ...editForm, workforceType: value });
  };

  const handleEditGenderChange = (value: string) => {
    setEditForm({ ...editForm, gender: value });
  };

  const handleEditHtHoursChange = (value: number) => {
    setEditForm({ ...editForm, htHours: value });
  };

  const handleEditNightHoursChange = (value: number) => {
    setEditForm({ ...editForm, nightHours: value });
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

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
        regime: emp.regime || '',
        workforceType: emp.workforceType || '',
        gender: emp.gender || '',
        htHours: emp.htHours || 0,
        nightHours: emp.nightHours || 0,
        fromRecap: false,
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
        nightHours: item.nightHours || 0,
        fromRecap: true,
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
    const refresh = () => {
      fetchEmployees();
    };
    window.addEventListener('monthly-recap-imported', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('employee-added', refresh);
    window.addEventListener('employee-deleted', refresh);
    return () => {
      window.removeEventListener('monthly-recap-imported', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('employee-added', refresh);
      window.removeEventListener('employee-deleted', refresh);
    };
  }, [refreshKey]);

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
      regime: newEmployee.regime,
      workforceType: newEmployee.workforceType,
      gender: newEmployee.gender,
      htHours: newEmployee.htHours,
      nightHours: newEmployee.nightHours,
    };

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur serveur');
      
      // Rafraîchir la liste immédiatement
      await fetchEmployees();
      
      // Déclencher un événement pour les autres composants
      window.dispatchEvent(new Event('employee-added'));
      
      setShowAddModal(false);
      setNewEmployee({
        prenom: '', nom: '', id: '', matricule: '', position: '', department: '', status: 'Actif',
        age: 25, joinDate: '', regime: '', workforceType: '', gender: '', htHours: 0, nightHours: 0,
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
      regime: emp.regime || '',
      workforceType: emp.workforceType || '',
      gender: emp.gender || '',
      htHours: emp.htHours || 0,
      nightHours: emp.nightHours || 0,
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
      regime: editForm.regime,
      workforceType: editForm.workforceType,
      gender: editForm.gender,
      htHours: editForm.htHours,
      nightHours: editForm.nightHours,
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
      window.dispatchEvent(new Event('employee-added'));
      setShowEditModal(false);
      setEditingEmployee(null);
    } catch (err: any) {
      alert(`Erreur modification: ${err.message}`);
    }
  };

  // ========== DELETE EMPLOYEE (individual) ==========
  const handleDeleteEmployee = async (id: string, fromRecap: boolean = false) => {
    if (!window.confirm('Supprimer cet employé ?')) return;
    try {
      const endpoint = fromRecap ? `/api/monthly-recap/${id}` : `/api/employees/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchEmployees();
      window.dispatchEvent(new Event('employee-deleted'));
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // ========== DELETE WITH SELECTION (BULK) ==========
  const toggleSelectEmployee = (id: string, isImported: boolean) => {
    const key = `${isImported ? 'recap' : 'emp'}:${id}`;
    const newSelected = new Set(selectedForDelete);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedForDelete(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedForDelete.size === filteredEmployees.length) {
      setSelectedForDelete(new Set());
    } else {
      const allIds = new Set(filteredEmployees.map(e => `${e.fromRecap ? 'recap' : 'emp'}:${e.id}`));
      setSelectedForDelete(allIds);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedForDelete.size === 0) {
      alert('Sélectionnez au moins un employé');
      return;
    }
    if (!window.confirm(`Supprimer ${selectedForDelete.size} employé(s) ?`)) return;

    const selectedArray = Array.from(selectedForDelete);
    const regularIds = selectedArray
      .filter(id => id.startsWith('emp:'))
      .map(id => id.replace('emp:', ''));
    const importedIds = selectedArray
      .filter(id => id.startsWith('recap:'))
      .map(id => id.replace('recap:', ''));

    try {
      const response = await fetch('/api/employees/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: regularIds, recapIds: importedIds }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }
      
      const result = await response.json();
      alert(result.message);
      
      setSelectedForDelete(new Set());
      setShowDeleteConfirm(false);
      await fetchEmployees();
      window.dispatchEvent(new Event('employee-deleted'));
      
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
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
  const totalMensuel = employees.filter(e => e.regime?.toLowerCase() === 'mensuel').length;
  const totalHoraire = employees.filter(e => e.regime?.toLowerCase() === 'horaire').length;
  const totalJournalier = employees.filter(e => e.regime?.toLowerCase() === 'journalier').length;

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
          <div className="stat-card"><div className="stat-value">{totalMensuel}</div><div className="stat-label">MENSUEL</div></div>
          <div className="stat-card"><div className="stat-value">{totalHoraire}</div><div className="stat-label">HORAIRE</div></div>
          <div className="stat-card"><div className="stat-value">{totalJournalier}</div><div className="stat-label">JOURNALIER</div></div>
        </div>

        <div className="toolbar">
          <input
            type="text"
            placeholder="Rechercher par nom, matricule ou poste"
            className="search-input"
            value={searchTerm}
            onChange={(e) => handleSearchTermChange(e.target.value)}
          />
          <div className="filters">
            <select className="status-filter" value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)}>
              <option>Tous les statuts</option><option>Actif</option><option>En congé</option><option>Absent</option>
            </select>
            <label className="btn-import">
              📂 Importer Récap
              <input type="file" accept=".xlsx,.xls,.ods" onChange={handleImportExcel} hidden />
            </label>
            <button className="btn-add" onClick={() => setShowAddModal(true)}>Ajouter</button>
            {selectedForDelete.size > 0 && (
              <button className="btn-delete-bulk" onClick={() => setShowDeleteConfirm(true)}>
                Supprimer ({selectedForDelete.size})
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedForDelete.size === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Employé</th>
                <th>Régime</th>
                <th>Département</th>
                <th>Type d'effectif</th>
                <th>Genre</th>
                <th>Date d'embauche</th>
                <th>Matricule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedForDelete.has(`${emp.fromRecap ? 'recap' : 'emp'}:${emp.id}`)}
                      onChange={() => toggleSelectEmployee(emp.id, emp.fromRecap || false)}
                    />
                  </td>
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
                  <td>{emp.matricule}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => handleEditClick(emp)}>✏️</button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucun employé trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
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
                  onChange={(e) => handleNewPrenomChange(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Nom (Last name)</label>
                <input 
                  type="text" 
                  placeholder="Nom" 
                  value={newEmployee.nom} 
                  onChange={(e) => handleNewNomChange(e.target.value)} 
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
                  onChange={(e) => handleNewIdChange(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Matricule</label>
                <input 
                  type="text" 
                  placeholder="Matricule" 
                  value={newEmployee.matricule} 
                  onChange={(e) => handleNewMatriculeChange(e.target.value)} 
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
                  onChange={(e) => handleNewPositionChange(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input 
                  type="text" 
                  placeholder="Département" 
                  value={newEmployee.department} 
                  onChange={(e) => handleNewDepartmentChange(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={newEmployee.status} 
                  onChange={(e) => handleNewStatusChange(e.target.value as EmployeeStatus)}
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
                  onChange={(e) => handleNewAgeChange(parseInt(e.target.value))} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of joining</label>
                <input 
                  type="date" 
                  value={newEmployee.joinDate} 
                  onChange={(e) => handleNewJoinDateChange(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Régime</label>
                <select 
                  value={newEmployee.regime} 
                  onChange={(e) => handleNewRegimeChange(e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  <option value="Mensuel">Mensuel</option>
                  <option value="Horaire">Horaire</option>
                  <option value="Journalier">Journalier</option>
                </select>
              </div>
              <div className="form-group">
                <label>Type d'effectif</label>
                <input 
                  type="text" 
                  placeholder="Type d'effectif" 
                  value={newEmployee.workforceType} 
                  onChange={(e) => handleNewWorkforceTypeChange(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Genre</label>
                <select 
                  value={newEmployee.gender} 
                  onChange={(e) => handleNewGenderChange(e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                </select>
              </div>
              <div className="form-group">
                <label>H. T (hours)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={newEmployee.htHours} 
                  onChange={(e) => handleNewHtHoursChange(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Night Hours (H. NUIT)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={newEmployee.nightHours} 
                  onChange={(e) => handleNewNightHoursChange(parseFloat(e.target.value) || 0)} 
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

      {/* Edit Modal */}
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
                  onChange={(e) => handleEditPrenomChange(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Nom (Last name)</label>
                <input 
                  type="text" 
                  value={editForm.nom} 
                  onChange={(e) => handleEditNomChange(e.target.value)} 
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
                  onChange={(e) => handleEditMatriculeChange(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Job title</label>
                <input 
                  type="text" 
                  value={editForm.position} 
                  onChange={(e) => handleEditPositionChange(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input 
                  type="text" 
                  value={editForm.department} 
                  onChange={(e) => handleEditDepartmentChange(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={editForm.status} 
                  onChange={(e) => handleEditStatusChange(e.target.value as EmployeeStatus)}
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
                  onChange={(e) => handleEditAgeChange(parseInt(e.target.value))} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of joining</label>
                <input 
                  type="date" 
                  value={editForm.joinDate} 
                  onChange={(e) => handleEditJoinDateChange(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Régime</label>
                <select 
                  value={editForm.regime} 
                  onChange={(e) => handleEditRegimeChange(e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  <option value="Mensuel">Mensuel</option>
                  <option value="Horaire">Horaire</option>
                  <option value="Journalier">Journalier</option>
                </select>
              </div>
              <div className="form-group">
                <label>Type d'effectif</label>
                <input 
                  type="text" 
                  placeholder="Type d'effectif" 
                  value={editForm.workforceType} 
                  onChange={(e) => handleEditWorkforceTypeChange(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Genre</label>
                <select 
                  value={editForm.gender} 
                  onChange={(e) => handleEditGenderChange(e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                </select>
              </div>
              <div className="form-group">
                <label>H. T (hours)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={editForm.htHours} 
                  onChange={(e) => handleEditHtHoursChange(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Night Hours (H. NUIT)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={editForm.nightHours} 
                  onChange={(e) => handleEditNightHoursChange(parseFloat(e.target.value) || 0)} 
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer {selectedForDelete.size} employé(s) ? Cette action ne peut pas être annulée.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Annuler</button>
              <button className="btn-delete" onClick={handleBulkDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;
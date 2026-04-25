import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Navbar from './Navbar';
import '../style/Employee.css';

type EmployeeStatus = 'Actif' | 'En congé' | 'À supprimer';

interface EmployeeData {
  id: string;
  matricule: string;     // nouveau champ pour le matricule
  name: string;
  department: string;
  position: string;
  age: number;
  seniority: number;
  status: EmployeeStatus;
  joinDate?: string;
}

const Employee: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous les statuts');

  // Modal d'ajout
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    id: '',
    matricule: '',
    position: '',
    department: '',
    status: 'Actif' as EmployeeStatus,
    age: 25,
    joinDate: '',
  });

  // Modal de modification
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    id: '',
    matricule: '',
    position: '',
    department: '',
    status: 'Actif' as EmployeeStatus,
    age: 25,
    joinDate: '',
  });

  // Données fictives (sans absences ni heures sup.)
  const [employees, setEmployees] = useState<EmployeeData[]>([
    {
      id: 'EMP-1124',
      matricule: '1124',
      name: 'Sofia Rossi',
      department: 'Marketing',
      position: 'Brand Manager',
      age: 29,
      seniority: 3,
      status: 'En congé',
      joinDate: '2023-01-15'
    },
    {
      id: 'EMP-1156',
      matricule: '1156',
      name: 'David Mercier',
      department: 'Finance',
      position: 'Contrôleur de gestion',
      age: 45,
      seniority: 13,
      status: 'Actif',
      joinDate: '2013-05-20'
    },
    {
      id: 'EMP-1201',
      matricule: '1201',
      name: 'Leila Benali',
      department: 'IT',
      position: 'DevOps',
      age: 32,
      seniority: 5,
      status: 'Actif',
      joinDate: '2021-09-10'
    },
    {
      id: 'EMP-1189',
      matricule: '1189',
      name: 'Thomas Dubois',
      department: 'RH',
      position: 'Recruteur',
      age: 38,
      seniority: 8,
      status: 'À supprimer',
      joinDate: '2018-03-01'
    }
  ]);

  // Statistiques
  const total = employees.length;
  const actifs = employees.filter(e => e.status === 'Actif').length;
  const enCongé = employees.filter(e => e.status === 'En congé').length;
  const àSupprimer = employees.filter(e => e.status === 'À supprimer').length;

  // Filtres
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tous les statuts' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Import Excel (adapté)
  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      
      const newEmployees: EmployeeData[] = rows.map((row: any) => ({
        id: row['ID'] || row['Employee ID'] || `EMP-${Math.floor(Math.random()*10000)}`,
        matricule: row['Matricule'] || row['ID'] || '',
        name: row['Nom'] || row['Name'] || '',
        department: row['Département'] || row['Department'] || '',
        position: row['Poste'] || row['Job title'] || '',
        age: parseInt(row['Age'] || 30),
        seniority: parseInt(row['Ancienneté'] || row['Seniority'] || 0),
        status: (row['Statut'] || row['Status'] || 'Actif') as EmployeeStatus,
        joinDate: row['Date d\'arrivée'] || row['Join date'] || ''
      }));
      
      setEmployees([...employees, ...newEmployees]);
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  // Ajouter employé
  const handleAddEmployee = () => {
    const emp: EmployeeData = {
      id: newEmployee.id || `EMP-${Math.floor(Math.random()*10000)}`,
      matricule: newEmployee.matricule,
      name: newEmployee.name,
      department: newEmployee.department,
      position: newEmployee.position,
      age: newEmployee.age,
      seniority: newEmployee.joinDate ? new Date().getFullYear() - new Date(newEmployee.joinDate).getFullYear() : 0,
      status: newEmployee.status,
      joinDate: newEmployee.joinDate,
    };
    setEmployees([...employees, emp]);
    setShowAddModal(false);
    setNewEmployee({
      name: '', id: '', matricule: '', position: '', department: '', status: 'Actif',
      age: 25, joinDate: '',
    });
  };

  // Supprimer employé
  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  // Ouvrir modal de modification
  const handleEditClick = (emp: EmployeeData) => {
    setEditingEmployee(emp);
    setEditForm({
      name: emp.name,
      id: emp.id,
      matricule: emp.matricule,
      position: emp.position,
      department: emp.department,
      status: emp.status,
      age: emp.age,
      joinDate: emp.joinDate || '',
    });
    setShowEditModal(true);
  };

  // Sauvegarder modification
  const handleSaveEdit = () => {
    if (!editingEmployee) return;
    const updatedEmployee: EmployeeData = {
      ...editingEmployee,
      name: editForm.name,
      matricule: editForm.matricule,
      position: editForm.position,
      department: editForm.department,
      status: editForm.status,
      age: editForm.age,
      seniority: editForm.joinDate ? new Date().getFullYear() - new Date(editForm.joinDate).getFullYear() : editingEmployee.seniority,
      joinDate: editForm.joinDate,
    };
    setEmployees(employees.map(emp => emp.id === editingEmployee.id ? updatedEmployee : emp));
    setShowEditModal(false);
    setEditingEmployee(null);
  };

  return (
    <div>
      <Navbar />
      <div className="employee-page">
        <div className="page-header">
          <h1>Employés</h1>
          <p className="subtitle">Question confirmée que des données individuelles n'ont été collectées.</p>
        </div>

        {/* Cartes statistiques */}
        <div className="stats-cards">
          <div className="stat-card"><div className="stat-value">{total}</div><div className="stat-label">TOTAL</div></div>
          <div className="stat-card"><div className="stat-value">{actifs}</div><div className="stat-label">ACTIFS</div></div>
          <div className="stat-card"><div className="stat-value">{enCongé}</div><div className="stat-label">EN CONGÉ</div></div>
          <div className="stat-card"><div className="stat-value">{àSupprimer}</div><div className="stat-label">À supprimer</div></div>
        </div>

        {/* Barre d'outils */}
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
              <option>Tous les statuts</option><option>Actif</option><option>En congé</option><option>À supprimer</option>
            </select>
            <label className="btn-import">
              📂 Importer Excel
              <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} hidden />
            </label>
            <button className="btn-add" onClick={() => setShowAddModal(true)}>Ajouter</button>
          </div>
        </div>

        {/* Tableau : colonnes : Employé, Département, Matricule, Actions */}
        <div className="table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Département</th>
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
                    <div className="employee-details">{emp.age} ans - {emp.seniority} ans</div>
                  </td>
                  <td>{emp.department}</td>
                  <td>{emp.matricule}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => handleEditClick(emp)}>✏️</button>
                    <button className="action-btn delete" onClick={() => handleDeleteEmployee(emp.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout (sans absences, heures sup, performance, trainings) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add new employee</h2>
            <p>Fill in the details to onboard a new team member.</p>
            <div className="form-row">
              <div className="form-group"><label>Full name</label><input value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} /></div>
              <div className="form-group"><label>Employee ID</label><input value={newEmployee.id} onChange={e => setNewEmployee({...newEmployee, id: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Matricule</label><input value={newEmployee.matricule} onChange={e => setNewEmployee({...newEmployee, matricule: e.target.value})} /></div>
              <div className="form-group"><label>Job title</label><input value={newEmployee.position} onChange={e => setNewEmployee({...newEmployee, position: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Department</label><input value={newEmployee.department} onChange={e => setNewEmployee({...newEmployee, department: e.target.value})} /></div>
              <div className="form-group"><label>Status</label><select value={newEmployee.status} onChange={e => setNewEmployee({...newEmployee, status: e.target.value as EmployeeStatus})}>
                <option>Actif</option><option>En congé</option><option>À supprimer</option>
              </select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Age</label><input type="number" value={newEmployee.age} onChange={e => setNewEmployee({...newEmployee, age: parseInt(e.target.value)})} /></div>
              <div className="form-group"><label>Date of joining</label><input type="date" value={newEmployee.joinDate} onChange={e => setNewEmployee({...newEmployee, joinDate: e.target.value})} /></div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleAddEmployee}>Add employee</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && editingEmployee && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit employee</h2>
            <p>Modify the details of {editingEmployee.name}.</p>
            <div className="form-row">
              <div className="form-group"><label>Full name</label><input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
              <div className="form-group"><label>Employee ID</label><input value={editForm.id} disabled /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Matricule</label><input value={editForm.matricule} onChange={e => setEditForm({...editForm, matricule: e.target.value})} /></div>
              <div className="form-group"><label>Job title</label><input value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Department</label><input value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} /></div>
              <div className="form-group"><label>Status</label><select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as EmployeeStatus})}>
                <option>Actif</option><option>En congé</option><option>À supprimer</option>
              </select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Age</label><input type="number" value={editForm.age} onChange={e => setEditForm({...editForm, age: parseInt(e.target.value)})} /></div>
              <div className="form-group"><label>Date of joining</label><input type="date" value={editForm.joinDate} onChange={e => setEditForm({...editForm, joinDate: e.target.value})} /></div>
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
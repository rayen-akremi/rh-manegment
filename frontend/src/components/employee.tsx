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

// Toast component for notifications
const Toast: React.FC<{ message: string; type?: 'success' | 'error'; onClose: () => void }> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`custom-toast ${type === 'error' ? 'toast-error' : ''}`}>
      <span className="toast-icon">{type === 'success' ? '✅' : '❌'}</span>
      <span className="toast-message">{message}</span>
    </div>
  );
};

// Validation error interface
interface ValidationErrors {
  prenom?: string;
  nom?: string;
  id?: string;
  matricule?: string;
  position?: string;
  department?: string;
  age?: string;
  regime?: string;
  workforceType?: string;
  gender?: string;
  joinDate?: string;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

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

  // Validation functions
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case 'prenom':
        if (!value || !value.trim()) return 'Le prénom est requis';
        if (value.trim().length < 2) return 'Le prénom doit contenir au moins 2 caractères';
        return undefined;
      case 'nom':
        if (!value || !value.trim()) return 'Le nom est requis';
        if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
        return undefined;
      case 'id':
        if (!value || !value.trim()) return "L'ID employé est requis";
        if (!/^[A-Za-z0-9_-]+$/.test(value)) return "L'ID ne peut contenir que des lettres, chiffres, tirets et underscores";
        return undefined;
      case 'matricule':
        if (!value || !value.trim()) return 'Le matricule est requis';
        return undefined;
      case 'position':
        if (!value || !value.trim()) return 'Le poste est requis';
        return undefined;
      case 'department':
        if (!value || !value.trim()) return 'Le département est requis';
        return undefined;
      case 'age':
        const ageNum = parseInt(value);
        if (isNaN(ageNum)) return "L'âge doit être un nombre";
        if (ageNum < 16) return "L'âge doit être au moins 16 ans";
        if (ageNum > 100) return "L'âge ne peut pas dépasser 100 ans";
        return undefined;
      case 'regime':
        if (!value) return 'Le régime est requis';
        return undefined;
      case 'workforceType':
        if (!value || !value.trim()) return "Le type d'effectif est requis";
        return undefined;
      case 'gender':
        if (!value) return 'Le genre est requis';
        return undefined;
      case 'joinDate':
        if (value) {
          const date = new Date(value);
          if (date > new Date()) return "La date d'embauche ne peut pas être dans le futur";
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const validateAllFields = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validate all required fields
    const fieldsToValidate = ['prenom', 'nom', 'id', 'matricule', 'position', 'department', 'age', 'regime', 'workforceType', 'gender'];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, newEmployee[field as keyof typeof newEmployee]);
      if (error) {
        errors[field as keyof ValidationErrors] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleFieldBlur = (field: string, value: any) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateField(field, value);
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  const getFieldClassName = (field: string): string => {
    const hasError = validationErrors[field as keyof ValidationErrors] && touchedFields.has(field);
    return hasError ? 'input-error' : '';
  };

  // Gestionnaires d'événements pour le formulaire d'ajout avec validation
  const handleNewPrenomChange = (value: string) => {
    setNewEmployee({ ...newEmployee, prenom: value });
    if (touchedFields.has('prenom')) {
      const error = validateField('prenom', value);
      setValidationErrors(prev => ({ ...prev, prenom: error }));
    }
  };

  const handleNewNomChange = (value: string) => {
    setNewEmployee({ ...newEmployee, nom: value });
    if (touchedFields.has('nom')) {
      const error = validateField('nom', value);
      setValidationErrors(prev => ({ ...prev, nom: error }));
    }
  };

  const handleNewIdChange = (value: string) => {
    setNewEmployee({ ...newEmployee, id: value });
    if (touchedFields.has('id')) {
      const error = validateField('id', value);
      setValidationErrors(prev => ({ ...prev, id: error }));
    }
  };

  const handleNewMatriculeChange = (value: string) => {
    setNewEmployee({ ...newEmployee, matricule: value });
    if (touchedFields.has('matricule')) {
      const error = validateField('matricule', value);
      setValidationErrors(prev => ({ ...prev, matricule: error }));
    }
  };

  const handleNewPositionChange = (value: string) => {
    setNewEmployee({ ...newEmployee, position: value });
    if (touchedFields.has('position')) {
      const error = validateField('position', value);
      setValidationErrors(prev => ({ ...prev, position: error }));
    }
  };

  const handleNewDepartmentChange = (value: string) => {
    setNewEmployee({ ...newEmployee, department: value });
    if (touchedFields.has('department')) {
      const error = validateField('department', value);
      setValidationErrors(prev => ({ ...prev, department: error }));
    }
  };

  const handleNewStatusChange = (value: EmployeeStatus) => {
    setNewEmployee({ ...newEmployee, status: value });
  };

  const handleNewAgeChange = (value: number) => {
    setNewEmployee({ ...newEmployee, age: value });
    if (touchedFields.has('age')) {
      const error = validateField('age', value);
      setValidationErrors(prev => ({ ...prev, age: error }));
    }
  };

  const handleNewJoinDateChange = (value: string) => {
    setNewEmployee({ ...newEmployee, joinDate: value });
    if (touchedFields.has('joinDate')) {
      const error = validateField('joinDate', value);
      setValidationErrors(prev => ({ ...prev, joinDate: error }));
    }
  };

  const handleNewRegimeChange = (value: string) => {
    setNewEmployee({ ...newEmployee, regime: value });
    if (touchedFields.has('regime')) {
      const error = validateField('regime', value);
      setValidationErrors(prev => ({ ...prev, regime: error }));
    }
  };

  const handleNewWorkforceTypeChange = (value: string) => {
    setNewEmployee({ ...newEmployee, workforceType: value });
    if (touchedFields.has('workforceType')) {
      const error = validateField('workforceType', value);
      setValidationErrors(prev => ({ ...prev, workforceType: error }));
    }
  };

  const handleNewGenderChange = (value: string) => {
    setNewEmployee({ ...newEmployee, gender: value });
    if (touchedFields.has('gender')) {
      const error = validateField('gender', value);
      setValidationErrors(prev => ({ ...prev, gender: error }));
    }
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

  // Reset modal state
  const resetAddModal = () => {
    setNewEmployee({
      prenom: '', nom: '', id: '', matricule: '', position: '', department: '', status: 'Actif',
      age: 25, joinDate: '', regime: '', workforceType: '', gender: '', htHours: 0, nightHours: 0,
    });
    setValidationErrors({});
    setTouchedFields(new Set());
    setShowAddModal(false);
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
      
      console.log('📊 [FETCH] Employés normaux reçus:', data.length);
      console.log('📊 [FETCH] Employés importés reçus:', recapData.length);
      
      const formatted: EmployeeData[] = (data || []).map((emp: any) => ({
        id: emp.employee_id || emp._id || '',
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
        id: item.matricule || item._id || '',
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

      const employeeMap = new Map();
      
      formatted.forEach(emp => {
        employeeMap.set(emp.id, emp);
      });
      
      recapEmployees.forEach(emp => {
        if (!employeeMap.has(emp.id)) {
          employeeMap.set(emp.id, emp);
        }
      });
      
      const allEmployees = Array.from(employeeMap.values());
      console.log('📊 [FETCH] Total après fusion:', allEmployees.length);
      setEmployees(allEmployees);
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
      console.log('🔄 [EVENT] Refresh déclenché');
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
  }, []);

  // ========== ADD EMPLOYEE WITH VALIDATION ==========
  const handleAddEmployee = async () => {
    // Mark all fields as touched
    const allFields = ['prenom', 'nom', 'id', 'matricule', 'position', 'department', 'age', 'regime', 'workforceType', 'gender'];
    const touched = new Set(touchedFields);
    allFields.forEach(f => touched.add(f));
    setTouchedFields(touched);
    
    // Validate all fields
    const errors: ValidationErrors = {};
    let isValid = true;
    
    allFields.forEach(field => {
      const error = validateField(field, newEmployee[field as keyof typeof newEmployee]);
      if (error) {
        errors[field as keyof ValidationErrors] = error;
        isValid = false;
      }
    });
    
    setValidationErrors(errors);
    
    if (!isValid) {
      setToastMessage("❌ Veuillez corriger les erreurs dans le formulaire");
      setToastType('error');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

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
      
      setToastMessage(`✅ Employé ${newEmployee.prenom} ${newEmployee.nom} ajouté avec succès !`);
      setToastType('success');
      
      await fetchEmployees();
      window.dispatchEvent(new Event('employee-added'));
      
      resetAddModal();
      
      setTimeout(() => setToastMessage(null), 3000);
      
    } catch (err: any) {
      setToastMessage(`❌ Erreur lors de l'ajout: ${err.message}`);
      setToastType('error');
      setTimeout(() => setToastMessage(null), 3000);
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
      
      setToastMessage(`✅ Employé ${editForm.prenom} ${editForm.nom} modifié avec succès !`);
      setToastType('success');
      
      await fetchEmployees();
      window.dispatchEvent(new Event('employee-added'));
      setShowEditModal(false);
      setEditingEmployee(null);
      
      setTimeout(() => setToastMessage(null), 3000);
      
    } catch (err: any) {
      setToastMessage(`❌ Erreur modification: ${err.message}`);
      setToastType('error');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // ========== DELETE SINGLE EMPLOYEE ==========
  const handleDeleteEmployee = async (id: string, fromRecap: boolean = false) => {
    if (!window.confirm('Supprimer cet employé ?')) return;
    
    const deletedEmployee = employees.find(emp => emp.id === id);
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    
    try {
      const endpoint = fromRecap ? `/api/monthly-recap/${id}` : `/api/employees/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      
      setToastMessage(`✅ Employé supprimé avec succès !`);
      setToastType('success');
      
      window.dispatchEvent(new Event('employee-deleted'));
      await fetchEmployees();
      
      setTimeout(() => setToastMessage(null), 3000);
      
    } catch (err) {
      if (deletedEmployee) {
        setEmployees(prev => [deletedEmployee, ...prev]);
      }
      setToastMessage(`❌ Erreur lors de la suppression`);
      setToastType('error');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // ========== DELETE BULK ==========
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
    if (selectedForDelete.size === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedForDelete(new Set());
    } else {
      const allIds = new Set(
        filteredEmployees.map(e => `${e.fromRecap ? 'recap' : 'emp'}:${e.id}`)
      );
      setSelectedForDelete(allIds);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedForDelete.size === 0) {
      setToastMessage("❌ Sélectionnez au moins un employé");
      setToastType('error');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (!window.confirm(`Supprimer ${selectedForDelete.size} employé(s) ? Cette action est irréversible.`)) return;

    setIsDeleting(true);

    const selectedArray = Array.from(selectedForDelete);
    const regularIds = selectedArray
      .filter(id => id.startsWith('emp:'))
      .map(id => id.replace('emp:', ''));
    const importedIds = selectedArray
      .filter(id => id.startsWith('recap:'))
      .map(id => id.replace('recap:', ''));

    const allIdsToRemove = [...regularIds, ...importedIds];

    const deletedEmployeesBackup = employees.filter(emp => allIdsToRemove.includes(emp.id));

    setEmployees(prev => prev.filter(emp => !allIdsToRemove.includes(emp.id)));
    setSelectedForDelete(new Set());
    setShowDeleteConfirm(false);

    try {
      const response = await fetch('/api/employees/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: regularIds, recapIds: importedIds }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }
      
      setToastMessage(`✅ ${result.message}`);
      setToastType('success');
      
      window.dispatchEvent(new Event('employee-deleted'));
      await fetchEmployees();
      
      setTimeout(() => setToastMessage(null), 3000);
      
    } catch (err: any) {
      console.error('❌ [BULK] Erreur:', err);
      setToastMessage(`❌ ${err.message || 'Erreur lors de la suppression'}`);
      setToastType('error');
      setEmployees(prev => [...deletedEmployeesBackup, ...prev]);
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsDeleting(false);
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
      
      setToastMessage(`✅ ${data.message}`);
      setToastType('success');
      
      await fetchEmployees();
      
      setTimeout(() => setToastMessage(null), 3000);
      
    } catch (err: any) {
      setToastMessage(`❌ Erreur import: ${err.message}`);
      setToastType('error');
      setTimeout(() => setToastMessage(null), 3000);
    }
    event.target.value = '';
  };

  // ========== STATISTICS ==========
  const total = employees.length;
  const totalMensuel = employees.filter(e => e.regime?.toLowerCase() === 'mensuel').length;
  const totalHoraire = employees.filter(e => e.regime?.toLowerCase() === 'horaire').length;
  const totalJournalier = employees.filter(e => e.regime?.toLowerCase() === 'journalier').length;

  // ========== FILTER ==========
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
      
      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
      
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
              <option>Tous les statuts</option>
              <option>Actif</option>
              <option>En congé</option>
              <option>Absent</option>
            </select>
            <label className="btn-import">
              📂 Importer Récap
              <input type="file" accept=".xlsx,.xls,.ods" onChange={handleImportExcel} hidden />
            </label>
            <button className="btn-add" onClick={() => setShowAddModal(true)} disabled={isDeleting}>Ajouter</button>
            {selectedForDelete.size > 0 && (
              <button className="btn-delete-bulk" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>
                {isDeleting ? 'Suppression...' : `🗑️ Supprimer (${selectedForDelete.size})`}
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
                    disabled={isDeleting}
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
                      disabled={isDeleting}
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
                    {!emp.fromRecap && (
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleEditClick(emp)}
                        disabled={isDeleting}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                    )}
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

      {/* Add Modal with Red Error Fields */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => resetAddModal()}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>➕ Ajouter un employé</h2>
            <p>Remplissez les informations pour ajouter un nouveau employé.</p>
            
            {/* Affichage des erreurs globales */}
            {Object.keys(validationErrors).length > 0 && touchedFields.size > 0 && (
              <div className="error-summary">
                <span className="error-summary-icon">⚠️</span>
                <ul className="error-summary-list">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    error && touchedFields.has(field) && <li key={field}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>Prénom <span className="required-star">*</span></label>
                <input 
                  type="text" 
                  placeholder="Prénom" 
                  value={newEmployee.prenom} 
                  onChange={(e) => handleNewPrenomChange(e.target.value)}
                  onBlur={(e) => handleFieldBlur('prenom', e.target.value)}
                  className={getFieldClassName('prenom')}
                />
                {validationErrors.prenom && touchedFields.has('prenom') && (
                  <span className="error-message">{validationErrors.prenom}</span>
                )}
              </div>
              <div className="form-group">
                <label>Nom <span className="required-star">*</span></label>
                <input 
                  type="text" 
                  placeholder="Nom" 
                  value={newEmployee.nom} 
                  onChange={(e) => handleNewNomChange(e.target.value)}
                  onBlur={(e) => handleFieldBlur('nom', e.target.value)}
                  className={getFieldClassName('nom')}
                />
                {validationErrors.nom && touchedFields.has('nom') && (
                  <span className="error-message">{validationErrors.nom}</span>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>ID Employé <span className="required-star">*</span></label>
                <input 
                  type="text" 
                  placeholder="ID (ex: EMP001)" 
                  value={newEmployee.id} 
                  onChange={(e) => handleNewIdChange(e.target.value)}
                  onBlur={(e) => handleFieldBlur('id', e.target.value)}
                  className={getFieldClassName('id')}
                />
                {validationErrors.id && touchedFields.has('id') && (
                  <span className="error-message">{validationErrors.id}</span>
                )}
              </div>
              <div className="form-group">
                <label>Matricule <span className="required-star">*</span></label>
                <input 
                  type="text" 
                  placeholder="Matricule" 
                  value={newEmployee.matricule} 
                  onChange={(e) => handleNewMatriculeChange(e.target.value)}
                  onBlur={(e) => handleFieldBlur('matricule', e.target.value)}
                  className={getFieldClassName('matricule')}
                />
                {validationErrors.matricule && touchedFields.has('matricule') && (
                  <span className="error-message">{validationErrors.matricule}</span>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Poste <span className="required-star">*</span></label>
                <input 
                  type="text" 
                  placeholder="Poste" 
                  value={newEmployee.position} 
                  onChange={(e) => handleNewPositionChange(e.target.value)}
                  onBlur={(e) => handleFieldBlur('position', e.target.value)}
                  className={getFieldClassName('position')}
                />
                {validationErrors.position && touchedFields.has('position') && (
                  <span className="error-message">{validationErrors.position}</span>
                )}
              </div>
              <div className="form-group">
                <label>Département <span className="required-star">*</span></label>
                <input 
                  type="text" 
                  placeholder="Département" 
                  value={newEmployee.department} 
                  onChange={(e) => handleNewDepartmentChange(e.target.value)}
                  onBlur={(e) => handleFieldBlur('department', e.target.value)}
                  className={getFieldClassName('department')}
                />
                {validationErrors.department && touchedFields.has('department') && (
                  <span className="error-message">{validationErrors.department}</span>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Statut <span className="required-star">*</span></label>
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
                <label>Âge <span className="required-star">*</span></label>
                <input 
                  type="number" 
                  value={newEmployee.age} 
                  onChange={(e) => handleNewAgeChange(parseInt(e.target.value))}
                  onBlur={(e) => handleFieldBlur('age', parseInt(e.target.value))}
                  className={getFieldClassName('age')}
                />
                {validationErrors.age && touchedFields.has('age') && (
                  <span className="error-message">{validationErrors.age}</span>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Date d'embauche</label>
                <input 
                  type="date" 
                  value={newEmployee.joinDate} 
                  onChange={(e) => handleNewJoinDateChange(e.target.value)}
                  onBlur={(e) => handleFieldBlur('joinDate', e.target.value)}
                  className={getFieldClassName('joinDate')}
                />
                {validationErrors.joinDate && touchedFields.has('joinDate') && (
                  <span className="error-message">{validationErrors.joinDate}</span>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Régime <span className="required-star">*</span></label>
                <select 
                  value={newEmployee.regime} 
                  onChange={(e) => handleNewRegimeChange(e.target.value)}
                  onBlur={() => handleFieldBlur('regime', newEmployee.regime)}
                  className={getFieldClassName('regime')}
                >
                  <option value="">Sélectionner</option>
                  <option value="Mensuel">Mensuel</option>
                  <option value="Horaire">Horaire</option>
                  <option value="Journalier">Journalier</option>
                </select>
                {validationErrors.regime && touchedFields.has('regime') && (
                  <span className="error-message">{validationErrors.regime}</span>
                )}
              </div>
              <div className="form-group">
                <label>Type d'effectif <span className="required-star">*</span></label>
                <input 
                  type="text" 
                  placeholder="Type d'effectif" 
                  value={newEmployee.workforceType} 
                  onChange={(e) => handleNewWorkforceTypeChange(e.target.value)}
                  onBlur={(e) => handleFieldBlur('workforceType', e.target.value)}
                  className={getFieldClassName('workforceType')}
                />
                {validationErrors.workforceType && touchedFields.has('workforceType') && (
                  <span className="error-message">{validationErrors.workforceType}</span>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Genre <span className="required-star">*</span></label>
                <select 
                  value={newEmployee.gender} 
                  onChange={(e) => handleNewGenderChange(e.target.value)}
                  onBlur={() => handleFieldBlur('gender', newEmployee.gender)}
                  className={getFieldClassName('gender')}
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                </select>
                {validationErrors.gender && touchedFields.has('gender') && (
                  <span className="error-message">{validationErrors.gender}</span>
                )}
              </div>
              <div className="form-group">
                <label>Heures (HT)</label>
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
                <label>Heures de Nuit</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={newEmployee.nightHours} 
                  onChange={(e) => handleNewNightHoursChange(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => resetAddModal()}>Annuler</button>
              <button className="btn-submit" onClick={handleAddEmployee}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingEmployee && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>✏️ Modifier l'employé</h2>
            <p>Modifiez les informations de <strong>{editingEmployee.name}</strong>.</p>
            <div className="form-row">
              <div className="form-group">
                <label>Prénom</label>
                <input 
                  type="text" 
                  value={editForm.prenom} 
                  onChange={(e) => handleEditPrenomChange(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input 
                  type="text" 
                  value={editForm.nom} 
                  onChange={(e) => handleEditNomChange(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>ID Employé</label>
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
                <label>Poste</label>
                <input 
                  type="text" 
                  value={editForm.position} 
                  onChange={(e) => handleEditPositionChange(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Département</label>
                <input 
                  type="text" 
                  value={editForm.department} 
                  onChange={(e) => handleEditDepartmentChange(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Statut</label>
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
                <label>Âge</label>
                <input 
                  type="number" 
                  value={editForm.age} 
                  onChange={(e) => handleEditAgeChange(parseInt(e.target.value))} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date d'embauche</label>
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
                <label>Heures (HT)</label>
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
                <label>Heures de Nuit</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={editForm.nightHours} 
                  onChange={(e) => handleEditNightHoursChange(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button className="btn-submit" onClick={handleSaveEdit}>💾 Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>⚠️ Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer <strong>{selectedForDelete.size}</strong> employé(s) ? Cette action ne peut pas être annulée.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Annuler</button>
              <button className="btn-delete" onClick={handleBulkDelete} disabled={isDeleting}>
                {isDeleting ? 'Suppression...' : '🗑️ Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;
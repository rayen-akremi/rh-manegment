import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import '../style/Settings.css';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  absenceAlerts: boolean;
  turnoverAlerts: boolean;
  workloadAlerts: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

interface SystemSettings {
  language: string;
  dateFormat: string;
  timezone: string;
  workingDaysPerMonth: number;
  overtimeThreshold: number;
  absenceThreshold: number;
}

const Settings: React.FC = () => {
  const { user, updateProfile, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [username, setUsername] = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    absenceAlerts: true,
    turnoverAlerts: true,
    workloadAlerts: false,
    weeklyReport: true,
    monthlyReport: false,
  });
  const [system, setSystem] = useState<SystemSettings>({
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Africa/Tunis',
    workingDaysPerMonth: 22,
    overtimeThreshold: 45,
    absenceThreshold: 3,
  });

  useEffect(() => {
    setUsername(user?.username || '');
    setAvatarPreview(user?.avatar || null);
  }, [user]);

  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notificationSettings');
      const savedSystem = localStorage.getItem('systemSettings');

      if (savedNotifications) {
        setNotifications((current) => ({ ...current, ...JSON.parse(savedNotifications) }));
      }
      if (savedSystem) {
        setSystem((current) => ({ ...current, ...JSON.parse(savedSystem) }));
      }
    } catch {
      localStorage.removeItem('notificationSettings');
      localStorage.removeItem('systemSettings');
      setError('Les parametres sauvegardes etaient invalides et ont ete reinitialises');
    }
  }, []);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez choisir une image valide');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('L image doit faire moins de 1 Mo');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result));
      setError('');
    };
    reader.onerror = () => setError('Impossible de lire cette image');
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setError('');

    if (username.trim().length < 3) {
      setError('Le nom utilisateur doit contenir au moins 3 caracteres');
      return;
    }

    setSaving(true);
    const success = await updateProfile({ username: username.trim(), avatar: avatarPreview });
    setSaving(false);

    if (success) {
      showSaved();
    } else {
      setError('Profile update failed');
    }
  };

  const updatePassword = async () => {
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }

    setSaving(true);
    const success = await updateProfile({
      currentPassword: passwordData.currentPassword,
      password: passwordData.newPassword,
    });
    setSaving(false);

    if (success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showSaved();
    } else {
      setError('Mot de passe actuel incorrect');
    }
  };

  const saveNotifications = async () => {
    setError('');

    if (notifications.pushNotifications && 'Notification' in window) {
      if (Notification.permission === 'denied') {
        setNotifications((current) => ({ ...current, pushNotifications: false }));
        setError('Les notifications du navigateur ont ete refusees');
        return;
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setNotifications((current) => ({ ...current, pushNotifications: false }));
          setError('Les notifications du navigateur ont ete refusees');
          return;
        }
      }
    }

    localStorage.setItem('notificationSettings', JSON.stringify(notifications));
    showSaved();
  };

  const saveSystem = () => {
    setError('');
    const hasValidNumbers = [
      system.workingDaysPerMonth,
      system.overtimeThreshold,
      system.absenceThreshold,
    ].every(Number.isFinite);

    if (!hasValidNumbers) {
      setError('Veuillez remplir tous les champs numeriques');
      return;
    }

    if (system.workingDaysPerMonth < 1 || system.workingDaysPerMonth > 31) {
      setError('Les jours travailles par mois doivent etre entre 1 et 31');
      return;
    }

    if (system.overtimeThreshold < 1 || system.absenceThreshold < 0) {
      setError('Veuillez saisir des seuils systeme valides');
      return;
    }

    localStorage.setItem('systemSettings', JSON.stringify(system));
    showSaved();
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setSystem({ ...system, [e.target.name]: value });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setError('');
    setSaved(false);
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    navigate('/login');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'User' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell' },
    { id: 'system', label: 'System', icon: 'Gear' },
    { id: 'security', label: 'Security', icon: 'Lock' },
  ];

  return (
    <div>
      <Navbar />
      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and system configuration</p>
        </div>

        {saved && <div className="toast-success">Settings saved successfully!</div>}
        {error && <div className="toast-error">{error}</div>}

        <div className="settings-container">
          <div className="settings-sidebar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="settings-content">
            {activeTab === 'profile' && (
              <div className="settings-section fade-in">
                <h2>Profile Settings</h2>
                <p className="section-desc">Update the admin account stored in the database</p>

                <div className="avatar-section">
                  <div className="avatar-preview">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" />
                    ) : (
                      <div className="avatar-placeholder">{(username || 'A').charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <label className="btn-secondary avatar-upload">
                    Change Avatar
                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                  {avatarPreview && (
                    <button className="btn-secondary" onClick={() => setAvatarPreview(null)}>
                      Remove Avatar
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={user?.email || 'manage@rh.com'} disabled />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-primary" onClick={saveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-section fade-in">
                <h2>Notification Preferences</h2>
                <p className="section-desc">Choose what notifications you want to receive</p>

                {Object.entries(notifications).map(([key, value]) => (
                  <div className="toggle-item" key={key}>
                    <div className="toggle-info">
                      <span className="toggle-title">{key.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase())}</span>
                    </div>
                    <label className="toggle-switch">
                      <input name={key} type="checkbox" checked={value} onChange={handleNotificationChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                ))}

                <div className="form-actions">
                  <button className="btn-primary" onClick={saveNotifications}>Save Preferences</button>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="settings-section fade-in">
                <h2>System Configuration</h2>
                <p className="section-desc">Configure system-wide settings</p>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Language</label>
                    <select name="language" value={system.language} onChange={handleSystemChange}>
                      <option value="fr">Francais</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date Format</label>
                    <select name="dateFormat" value={system.dateFormat} onChange={handleSystemChange}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Time Zone</label>
                    <select name="timezone" value={system.timezone} onChange={handleSystemChange}>
                      <option value="Africa/Tunis">Africa/Tunis</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Working Days Per Month</label>
                    <input name="workingDaysPerMonth" type="number" min="1" max="31" value={system.workingDaysPerMonth} onChange={handleSystemChange} />
                  </div>
                  <div className="form-group">
                    <label>Overtime Threshold</label>
                    <input name="overtimeThreshold" type="number" min="1" value={system.overtimeThreshold} onChange={handleSystemChange} />
                  </div>
                  <div className="form-group">
                    <label>Absence Threshold</label>
                    <input name="absenceThreshold" type="number" min="0" value={system.absenceThreshold} onChange={handleSystemChange} />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-primary" onClick={saveSystem}>Save System Settings</button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section fade-in">
                <h2>Security Settings</h2>
                <p className="section-desc">Manage your password and active sessions</p>

                <div className="settings-group">
                  <h3>Change Password</h3>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button className="btn-primary" onClick={updatePassword} disabled={saving}>
                    {saving ? 'Saving...' : 'Update Password'}
                  </button>
                </div>

                <div className="settings-group">
                  <h3>Session Management</h3>
                  <button className="btn-danger" onClick={handleLogoutAll}>Log out from all sessions</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

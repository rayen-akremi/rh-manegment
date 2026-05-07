import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import '../style/Settings.css';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  avatar: string;
}

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
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@rh.com',
    role: 'HR Manager',
    department: 'Human Resources',
    phone: '+216 12 345 678',
    avatar: '',
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
  const [saved, setSaved] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load saved settings from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    const savedNotifications = localStorage.getItem('notificationSettings');
    const savedSystem = localStorage.getItem('systemSettings');

    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedSystem) setSystem(JSON.parse(savedSystem));
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setSystem({ ...system, [e.target.name]: value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const saveProfile = () => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const saveNotifications = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const saveSystem = () => {
    localStorage.setItem('systemSettings', JSON.stringify(system));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updatePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    // Here you would call your API to update password
    alert('Mot de passe mis à jour avec succès');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const resetToDefault = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres par défaut ?')) {
      setProfile({
        name: 'John Doe',
        email: 'john.doe@rh.com',
        role: 'HR Manager',
        department: 'Human Resources',
        phone: '+216 12 345 678',
        avatar: '',
      });
      setNotifications({
        emailNotifications: true,
        pushNotifications: false,
        absenceAlerts: true,
        turnoverAlerts: true,
        workloadAlerts: false,
        weeklyReport: true,
        monthlyReport: false,
      });
      setSystem({
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Africa/Tunis',
        workingDaysPerMonth: 22,
        overtimeThreshold: 45,
        absenceThreshold: 3,
      });
      localStorage.removeItem('userProfile');
      localStorage.removeItem('notificationSettings');
      localStorage.removeItem('systemSettings');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const tabs = [
    { id: 'profile', label: ' Profile', icon: '👤' },
    { id: 'notifications', label: ' Notifications', icon: '🔔' },
    { id: 'system', label: ' System', icon: '⚙️' },
    { id: 'security', label: ' Security', icon: '🔒' },
  ];

  return (
    <div>
      <Navbar />
      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and system configuration</p>
        </div>

        {saved && (
          <div className="toast-success">
            ✅ Settings saved successfully!
          </div>
        )}

        <div className="settings-container">
          {/* Sidebar Tabs */}
          <div className="settings-sidebar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="settings-content">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="settings-section fade-in">
                <h2>Profile Settings</h2>
                <p className="section-desc">Update your personal information</p>

                <div className="avatar-section">
                  <div className="avatar-preview">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button className="btn-secondary">Change Avatar</button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleProfileChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      name="role"
                      value={profile.role}
                      onChange={handleProfileChange}
                      placeholder="Your role"
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      name="department"
                      value={profile.department}
                      onChange={handleProfileChange}
                      placeholder="Your department"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-primary" onClick={saveProfile}>
                    Save Changes
                  </button>
                  <button className="btn-secondary" onClick={resetToDefault}>
                    Reset to Default
                  </button>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="settings-section fade-in">
                <h2>Notification Preferences</h2>
                <p className="section-desc">Choose what notifications you want to receive</p>

                <div className="settings-group">
                  <h3>Channel Settings</h3>
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-title">Email Notifications</span>
                      <span className="toggle-desc">Receive notifications via email</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={notifications.emailNotifications}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-title">Push Notifications</span>
                      <span className="toggle-desc">Receive browser notifications</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="pushNotifications"
                        checked={notifications.pushNotifications}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-group">
                  <h3>Alert Preferences</h3>
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-title">Absence Alerts</span>
                      <span className="toggle-desc">Get notified when an employee exceeds absence threshold</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="absenceAlerts"
                        checked={notifications.absenceAlerts}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-title">Turnover Alerts</span>
                      <span className="toggle-desc">Get notified about unusual turnover rates</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="turnoverAlerts"
                        checked={notifications.turnoverAlerts}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-title">Workload Alerts</span>
                      <span className="toggle-desc">Get notified about employees exceeding workload limits</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="workloadAlerts"
                        checked={notifications.workloadAlerts}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-group">
                  <h3>Report Schedule</h3>
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-title">Weekly Report</span>
                      <span className="toggle-desc">Receive weekly HR summary report</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="weeklyReport"
                        checked={notifications.weeklyReport}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-title">Monthly Report</span>
                      <span className="toggle-desc">Receive detailed monthly analytics report</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="monthlyReport"
                        checked={notifications.monthlyReport}
                        onChange={handleNotificationChange}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-primary" onClick={saveNotifications}>
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="settings-section fade-in">
                <h2>System Configuration</h2>
                <p className="section-desc">Configure system-wide settings</p>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Language</label>
                    <select name="language" value={system.language} onChange={handleSystemChange}>
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
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
                      <option value="Africa/Tunis">Africa/Tunis (GMT+1)</option>
                      <option value="Europe/Paris">Europe/Paris (GMT+1/GMT+2)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Working Days Per Month</label>
                    <input
                      type="number"
                      name="workingDaysPerMonth"
                      value={system.workingDaysPerMonth}
                      onChange={handleSystemChange}
                      min="20"
                      max="31"
                    />
                    <small>Used for absence rate calculation</small>
                  </div>

                  <div className="form-group">
                    <label>Overtime Threshold (hours)</label>
                    <input
                      type="number"
                      name="overtimeThreshold"
                      value={system.overtimeThreshold}
                      onChange={handleSystemChange}
                      min="0"
                      max="100"
                    />
                    <small>Alert when overtime exceeds this value</small>
                  </div>

                  <div className="form-group">
                    <label>Absence Threshold (days)</label>
                    <input
                      type="number"
                      name="absenceThreshold"
                      value={system.absenceThreshold}
                      onChange={handleSystemChange}
                      min="0"
                      max="30"
                    />
                    <small>Alert when absence exceeds this value</small>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-primary" onClick={saveSystem}>
                    Save System Settings
                  </button>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="settings-section fade-in">
                <h2>Security Settings</h2>
                <p className="section-desc">Manage your password and security preferences</p>

                <div className="settings-group">
                  <h3>Change Password</h3>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button className="btn-primary" onClick={updatePassword}>
                    Update Password
                  </button>
                </div>

                <div className="settings-group">
                  <h3>Session Management</h3>
                  <button className="btn-danger">Log out from all devices</button>
                </div>

                <div className="settings-group">
                  <h3>Data Management</h3>
                  <button className="btn-warning" onClick={resetToDefault}>
                    Reset All Settings to Default
                  </button>
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
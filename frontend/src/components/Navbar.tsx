import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../style/navbar.css';

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>HR</h2>
        <p>Smart HR Analytics</p>
      </div>

      <div className="sidebar-section">
        <h3>Main</h3>
        <ul>
          <li><NavLink to="/dashboard">Dashboard</NavLink></li>
          <li><NavLink to="/employee">Employee</NavLink></li>
          <li><NavLink to="/ai-prediction">AI Prediction</NavLink></li>
          <li><NavLink to="/absence-management">Absence Management</NavLink></li>
          <li><NavLink to="/workload-management">Workload Management</NavLink></li>
          <li><NavLink to="/turnover">Turnover</NavLink></li>
        </ul>
      </div>

      <div className="sidebar-section">
        <h3>Data</h3>
        <ul>
          <li><NavLink to="/import-file">Import File</NavLink></li>
          <li><NavLink to="/export-file">Export File</NavLink></li>
        </ul>
      </div>

      <div className="sidebar-section">
        <h3>Account</h3>
        <ul>
          <li><NavLink to="/settings">Settings</NavLink></li>
          <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
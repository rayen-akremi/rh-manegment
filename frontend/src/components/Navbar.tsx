import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import '../style/navbar.css';

const Navbar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Check window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.sidebar') && !target.closest('.menu-toggle')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Menu toggle button for mobile */}
      <button className={`menu-toggle ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay for mobile */}
      {isMobile && isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <div className={`sidebar ${isMobile ? (isOpen ? 'open' : '') : ''}`}>
        <div className="sidebar-header">
          <div className="nav-profile">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" />
            ) : (
              <div className="nav-avatar-placeholder">
                {(user?.username || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2>{user?.username || 'Admin'}</h2>
              <p>{user?.email || 'Smart HR Analytics'}</p>
            </div>
          </div>
          {isMobile && (
            <button className="close-sidebar" onClick={closeSidebar}>✕</button>
          )}
        </div>

        <div className="sidebar-section">
          <h3>Main</h3>
          <ul>
            <li><NavLink to="/dashboard" onClick={closeSidebar}>Dashboard</NavLink></li>
            <li><NavLink to="/employee" onClick={closeSidebar}>Employee</NavLink></li>
            <li><NavLink to="/ai-prediction" onClick={closeSidebar}>AI Prediction</NavLink></li>
            <li><NavLink to="/absence-management" onClick={closeSidebar}>Absence Management</NavLink></li>
            <li><NavLink to="/workload-management" onClick={closeSidebar}>Workload Management</NavLink></li>
            <li><NavLink to="/turnover" onClick={closeSidebar}>Turnover</NavLink></li>
          </ul>
        </div>

        <div className="sidebar-section">
          <h3>Data</h3>
          <ul>
            <li><NavLink to="/import-file" onClick={closeSidebar}>Import File</NavLink></li>
            <li><NavLink to="/export-file" onClick={closeSidebar}>Export File</NavLink></li>
          </ul>
        </div>

        <div className="sidebar-section">
          <h3>Account</h3>
          <ul>
            <li><NavLink to="/settings" onClick={closeSidebar}>Settings</NavLink></li>
            <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
          </ul>
        </div>

        <div className="sidebar-footer">
          <ThemeToggle />
        </div>
      </div>
    </>
  );
};

export default Navbar;

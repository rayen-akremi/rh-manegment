import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Employee from './components/employee';
import AbsenceManagement from './components/AbsenceManagement';
import WorkloadManagement from './components/WorkloadManagement';
import AIPrediction from './components/AIPrediction';
import ImportFile from './components/import';
import ExportFile from './components/ExportFile';
import Settings from './components/settings';
import Turnover from './components/Turnover';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/employee" element={<PrivateRoute><Employee /></PrivateRoute>} />
          <Route path="/absence-management" element={<PrivateRoute><AbsenceManagement /></PrivateRoute>} />
          <Route path="/workload-management" element={<PrivateRoute><WorkloadManagement /></PrivateRoute>} />
          <Route path="/ai-prediction" element={<PrivateRoute><AIPrediction /></PrivateRoute>} />
          <Route path="/import-file" element={<PrivateRoute><ImportFile /></PrivateRoute>} />
          <Route path="/export-file" element={<PrivateRoute><ExportFile /></PrivateRoute>} />
          <Route path="/turnover" element={<PrivateRoute><Turnover /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
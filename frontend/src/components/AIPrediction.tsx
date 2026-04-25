import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import Navbar from './Navbar';
import '../style/AIPrediction.css';

type RiskType = 'Departure' | 'Absenteeism' | 'Overload';
type RiskLevel = 'Low' | 'Medium' | 'High';
type SuggestedAction = 'Mitigate' | 'Support' | 'Train' | 'Monitor';

interface EmployeeRisk {
  id: string;
  name: string;
  department: string;
  riskType: RiskType;
  riskLevel: RiskLevel;
  suggestedAction: SuggestedAction;
  riskScore: number;
}

interface DepartmentRisk {
  department: string;
  absenteeismRisk: number;   // on garde seulement ce champ pour le bar chart
}

// Données pour le bar chart : seulement le risque d'absence
const absenceRiskByDept: DepartmentRisk[] = [
  { department: 'Engineering', absenteeismRisk: 15 },
  { department: 'Sales', absenteeismRisk: 22 },
  { department: 'Marketing', absenteeismRisk: 28 },
  { department: 'Finance', absenteeismRisk: 12 },
  { department: 'Product', absenteeismRisk: 20 },
  { department: 'Support', absenteeismRisk: 35 },
];

// Données pour le line chart : tendance du risque de turnover (simulé sur 6 mois)
const turnoverRiskTrend = [
  { month: 'Avr', risk: 2.1 },
  { month: 'Mai', risk: 2.3 },
  { month: 'Juin', risk: 2.5 },
  { month: 'Juil', risk: 2.4 },
  { month: 'Aoû', risk: 2.6 },
  { month: 'Sep', risk: 2.8 },
];

const globalRisks = { departure: 24, absenteeism: 18, overload: 32 }; // inchangé

const initialEmployeeRisks: EmployeeRisk[] = [
  { id: '1', name: 'Sophia Rossi', department: 'Engineering', riskType: 'Departure', riskLevel: 'Medium', suggestedAction: 'Train', riskScore: 65 },
  { id: '2', name: 'Lucas Bernard', department: 'Sales', riskType: 'Overload', riskLevel: 'High', suggestedAction: 'Support', riskScore: 88 },
  { id: '3', name: 'Emma Wilson', department: 'Marketing', riskType: 'Absenteeism', riskLevel: 'Low', suggestedAction: 'Monitor', riskScore: 22 },
  { id: '4', name: 'John Doe', department: 'Finance', riskType: 'Departure', riskLevel: 'High', suggestedAction: 'Mitigate', riskScore: 91 },
  { id: '5', name: 'Maya Robinson', department: 'Engineering', riskType: 'Overload', riskLevel: 'Medium', suggestedAction: 'Support', riskScore: 59 },
  { id: '6', name: 'Ali Ben Salah', department: 'Product', riskType: 'Absenteeism', riskLevel: 'Medium', suggestedAction: 'Monitor', riskScore: 47 },
  { id: '7', name: 'Clara Dupont', department: 'Support', riskType: 'Departure', riskLevel: 'Low', suggestedAction: 'Train', riskScore: 34 },
  { id: '8', name: 'David Mercier', department: 'Sales', riskType: 'Overload', riskLevel: 'High', suggestedAction: 'Support', riskScore: 82 },
];

const heatmapData = [ // inchangé
  { department: 'Engineering', departure: 20, absenteeism: 15, overload: 30, overall: 'medium' },
  { department: 'Sales', departure: 35, absenteeism: 22, overload: 45, overall: 'high' },
  { department: 'Marketing', departure: 18, absenteeism: 28, overload: 20, overall: 'medium' },
  { department: 'Finance', departure: 42, absenteeism: 12, overload: 25, overall: 'high' },
  { department: 'Product', departure: 15, absenteeism: 20, overload: 18, overall: 'low' },
  { department: 'Support', departure: 25, absenteeism: 35, overload: 28, overall: 'high' },
];

const getRiskLevelColor = (level: RiskLevel): string => {
  switch (level) {
    case 'Low': return '#10b981';
    case 'Medium': return '#f59e0b';
    case 'High': return '#ef4444';
    default: return '#6b7280';
  }
};

const getOverallRiskColor = (overall: string): string => {
  switch (overall) {
    case 'low': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'high': return '#ef4444';
    default: return '#6b7280';
  }
};

const AIPrediction: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [riskTypeFilter, setRiskTypeFilter] = useState('All types');
  const [employees] = useState<EmployeeRisk[]>(initialEmployeeRisks);
  const [showAlerts, setShowAlerts] = useState(true);

  const highRiskThreshold = 75;
  const criticalAlerts = employees.filter(e => e.riskScore > highRiskThreshold).length;
  const departments = ['All departments', ...new Set(employees.map(e => e.department))];
  const riskTypes = ['All types', 'Departure', 'Absenteeism', 'Overload'];

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = departmentFilter === 'All departments' || emp.department === departmentFilter;
    const matchType = riskTypeFilter === 'All types' || emp.riskType === riskTypeFilter;
    return matchSearch && matchDept && matchType;
  });

  const recommendations = [
    "🔴 High departure risk in Finance (42%). Offer retention bonuses.",
    "⚠️ Overload risk in Sales (45%). Redistribute tasks immediately.",
    "🟡 Absenteeism trend increasing in Support. Schedule wellness checks.",
    "📊 Overall risk index: Medium. Focus on Sales and Finance teams."
  ];

  return (
    <div>
      <Navbar />
      <div className="ai-prediction-page">
        <div className="page-header">
          <h1>AI Prediction</h1>
          <p>Forecast HR risks and receive proactive insights.</p>
        </div>

        {/* Prediction Cards (inchangées) */}
        <div className="prediction-cards">
          <div className="prediction-card">
            <div className="card-icon">🚪</div>
            <div className="card-content">
              <div className="card-title">Departure Risk</div>
              <div className="card-value">{globalRisks.departure}%</div>
              <div className="card-trend">↑ 3% vs last month</div>
            </div>
          </div>
          <div className="prediction-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <div className="card-title">Absenteeism Risk</div>
              <div className="card-value">{globalRisks.absenteeism}%</div>
              <div className="card-trend">↑ 2% vs last month</div>
            </div>
          </div>
          <div className="prediction-card">
            <div className="card-icon">⚡</div>
            <div className="card-content">
              <div className="card-title">Work Overload Risk</div>
              <div className="card-value">{globalRisks.overload}%</div>
              <div className="card-trend">↑ 5% vs last month</div>
            </div>
          </div>
        </div>

        {/* AI Alerts (inchangé) */}
        {showAlerts && (
          <div className="ai-alerts">
            <div className="alert-header">
              <h3>🤖 AI Alerts & Recommendations</h3>
              <button className="close-alerts" onClick={() => setShowAlerts(false)}>✖</button>
            </div>
            <div className="alert-badge">{criticalAlerts} employees exceed high-risk threshold</div>
            <ul className="recommendations">
              {recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
            </ul>
          </div>
        )}

        {/* Employee Risk Table (inchangé) */}
        <div className="table-section">
          <div className="table-header">
            <h2>Employee Risk Assessment</h2>
            <div className="filters">
              <input type="text" placeholder="Search by name or dept" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
              <select value={riskTypeFilter} onChange={(e) => setRiskTypeFilter(e.target.value)}>
                {riskTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="table-container">
            <table className="risk-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Department</th><th>Risk Type</th><th>Risk Level</th><th>Risk Score</th><th>Suggested Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.department}</td>
                    <td>{emp.riskType}</td>
                    <td><span className="risk-level" style={{backgroundColor: getRiskLevelColor(emp.riskLevel)}}>{emp.riskLevel}</span></td>
                    <td>
                      <div className="risk-score-bar">
                        <div className="risk-score-fill" style={{width: `${emp.riskScore}%`, backgroundColor: getRiskLevelColor(emp.riskLevel)}}></div>
                        <span>{emp.riskScore}%</span>
                      </div>
                    </td>
                    <td>{emp.suggestedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts modifiées */}
        <div className="charts-row">
          {/* Bar Chart : seulement le risque d'absence */}
          <div className="chart-card">
            <h3>Risque d'absence par département</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={absenceRiskByDept}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="absenteeismRisk" fill="#10b981" name="Risque d'absence (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart : seulement le risque de turnover (données simulées) */}
          <div className="chart-card">
            <h3>Tendance du risque de turnover (6 derniers mois)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={turnoverRiskTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 4]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="risk" stroke="#f97316" name="Risque de turnover (%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap (inchangée) */}
        <div className="heatmap-section">
          <h3>🔥 High-Risk Zones (Heatmap by Department & Risk Type)</h3>
          <div className="heatmap-grid">
            <div className="heatmap-header"></div>
            <div className="heatmap-header">Departure</div>
            <div className="heatmap-header">Absenteeism</div>
            <div className="heatmap-header">Overload</div>
            {heatmapData.map(item => (
              <React.Fragment key={item.department}>
                <div className="heatmap-label">{item.department}</div>
                <div className="heatmap-cell" style={{backgroundColor: getOverallRiskColor(item.departure >= 30 ? 'high' : item.departure >= 20 ? 'medium' : 'low')}}>
                  {item.departure}%
                </div>
                <div className="heatmap-cell" style={{backgroundColor: getOverallRiskColor(item.absenteeism >= 30 ? 'high' : item.absenteeism >= 20 ? 'medium' : 'low')}}>
                  {item.absenteeism}%
                </div>
                <div className="heatmap-cell" style={{backgroundColor: getOverallRiskColor(item.overload >= 30 ? 'high' : item.overload >= 20 ? 'medium' : 'low')}}>
                  {item.overload}%
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="heatmap-legend">
            <span><span className="legend-low"></span> Low (&lt;20%)</span>
            <span><span className="legend-medium"></span> Medium (20-29%)</span>
            <span><span className="legend-high"></span> High (≥30%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPrediction;
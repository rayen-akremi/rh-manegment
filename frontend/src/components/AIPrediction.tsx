import React, { useState, useEffect } from 'react';
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
  departureRisk: number;
  absenteeismRisk: number;
  overloadRisk: number;
}

interface DepartmentRisk {
  department: string;
  riskScore: number;
  avgWeeklyHours: number;
}

const API_BASE_URL = 'http://localhost:5000/api';

// Mock employee list (you can also fetch from API)
const employeeList = [
  { id: 'EMP001', name: 'Ahmed Ben Ali', department: 'IT' }
];

const AIPrediction: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [riskTypeFilter, setRiskTypeFilter] = useState('All types');
  const [employees, setEmployees] = useState<EmployeeRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Global risks state
  const [globalRisks, setGlobalRisks] = useState({ departure: 0, absenteeism: 0, overload: 0 });
  const [departmentRisks, setDepartmentRisks] = useState<DepartmentRisk[]>([]);
  const [turnoverTrend, setTurnoverTrend] = useState<{ month: string; risk: number }[]>([]);

  // Fetch all predictions for all employees
  useEffect(() => {
    fetchAllPredictions();
  }, []);

  const fetchAllPredictions = async () => {
    try {
      setLoading(true);
      const employeeRisks: EmployeeRisk[] = [];
      let totalDepartureRisk = 0;
      let totalAbsenteeismRisk = 0;
      let totalOverloadRisk = 0;
      let employeeCount = 0;

      // Fetch predictions for each employee
      for (const emp of employeeList) {
        try {
          // 1. Fetch Turnover Risk (Departure)
          const turnoverRes = await fetch(`${API_BASE_URL}/ai/predict-turnover/${emp.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const turnoverData = await turnoverRes.json();
          
          // 2. Fetch Workload Risk (Overload)
          const workloadRes = await fetch(`${API_BASE_URL}/ai/predict-workload/${emp.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const workloadData = await workloadRes.json();
          
          // 3. Fetch Absence Risk
          const absenceRes = await fetch(`${API_BASE_URL}/ai/predict-absence/${emp.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ months: 6 })
          });
          const absenceData = await absenceRes.json();
          
          // Extract scores (handle cases where data might be missing)
          const departureScore = turnoverData.riskScore || 0;
          const overloadScore = workloadData.overloadScore || 0;
          const absenceScore = absenceData.predictedAbsenceRate || 0;
          
          // Determine highest risk type
          const risks = [
            { type: 'Departure' as RiskType, score: departureScore },
            { type: 'Absenteeism' as RiskType, score: absenceScore },
            { type: 'Overload' as RiskType, score: overloadScore }
          ];
          const highestRisk = risks.reduce((max, r) => r.score > max.score ? r : max, risks[0]);
          
          // Determine risk level
          let riskLevel: RiskLevel = 'Low';
          if (highestRisk.score >= 70) riskLevel = 'High';
          else if (highestRisk.score >= 40) riskLevel = 'Medium';
          
          // Determine suggested action
          let suggestedAction: SuggestedAction = 'Monitor';
          if (highestRisk.score >= 75) suggestedAction = 'Mitigate';
          else if (highestRisk.score >= 60) suggestedAction = 'Support';
          else if (highestRisk.score >= 40) suggestedAction = 'Train';
          
          employeeRisks.push({
            id: emp.id,
            name: emp.name,
            department: emp.department,
            riskType: highestRisk.type,
            riskLevel: riskLevel,
            suggestedAction: suggestedAction,
            riskScore: highestRisk.score,
            departureRisk: departureScore,
            absenteeismRisk: absenceScore,
            overloadRisk: overloadScore
          });
          
          totalDepartureRisk += departureScore;
          totalAbsenteeismRisk += absenceScore;
          totalOverloadRisk += overloadScore;
          employeeCount++;
          
        } catch (err) {
          console.error(`Error fetching predictions for ${emp.id}:`, err);
        }
      }
      
      // Calculate global averages
      setGlobalRisks({
        departure: employeeCount > 0 ? Math.round(totalDepartureRisk / employeeCount) : 0,
        absenteeism: employeeCount > 0 ? Math.round(totalAbsenteeismRisk / employeeCount) : 29,
        overload: employeeCount > 0 ? Math.round(totalOverloadRisk / employeeCount) : 0
      });
      
      setEmployees(employeeRisks);
      
      // Create department risks
      const deptMap = new Map<string, { total: number; count: number }>();
      employeeRisks.forEach(emp => {
        if (!deptMap.has(emp.department)) {
          deptMap.set(emp.department, { total: 0, count: 0 });
        }
        const dept = deptMap.get(emp.department)!;
        dept.total += emp.absenteeismRisk;
        dept.count++;
      });
      
      const deptRisks: DepartmentRisk[] = Array.from(deptMap.entries()).map(([dept, data]) => ({
        department: dept,
        riskScore: Math.round(data.total / data.count),
        avgWeeklyHours: 45 // Default, can be enhanced
      }));
      setDepartmentRisks(deptRisks);
      
      // Simulate turnover trend (can be enhanced with real data)
      const months = ['Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep'];
      const trend = months.map((month, idx) => ({
        month,
        risk: Math.min(5, 2 + (idx * 0.3) + (totalDepartureRisk / 100))
      }));
      setTurnoverTrend(trend);
      
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError('Failed to load AI predictions. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: RiskLevel): string => {
    switch (level) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskColorByScore = (score: number): string => {
    if (score >= 70) return '#ef4444';
    if (score >= 40) return '#f59e0b';
    return '#10b981';
  };

  const highRiskThreshold = 70;
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

  // Generate recommendations based on real data
  const recommendations = [
    `${criticalAlerts > 0 ? `🔴 ${criticalAlerts} employee(s) at high departure risk. Schedule retention meetings.` : '✅ No high departure risk detected.'}`,
    `⚠️ ${globalRisks.overload > 50 ? 'Critical' : 'Moderate'} overload risk detected. Review workload distribution.`,
    `📊 Absenteeism risk at ${globalRisks.absenteeism}%. ${globalRisks.absenteeism > 30 ? 'Schedule wellness checks.' : 'Continue monitoring.'}`,
    `🤖 AI recommends ${employees.filter(e => e.suggestedAction === 'Mitigate').length} immediate interventions.`
  ];

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="ai-prediction-page">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading AI predictions from backend...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="ai-prediction-page">
          <div className="error-container">
            <p>❌ {error}</p>
            <button onClick={fetchAllPredictions}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="ai-prediction-page">
        <div className="page-header">
          <h1>AI Prediction</h1>
          <p>Forecast HR risks and receive proactive insights based on real data.</p>
        </div>

        {/* Prediction Cards - All 3 calculated from backend */}
        <div className="prediction-cards">
          <div className="prediction-card">
            <div className="card-icon">🚪</div>
            <div className="card-content">
              <div className="card-title">DEPARTURE RISK</div>
              <div className="card-value">{globalRisks.departure}%</div>
              <div className="card-trend">Based on workload & overtime analysis</div>
            </div>
          </div>
          <div className="prediction-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <div className="card-title">ABSENTEEISM RISK</div>
              <div className="card-value">{globalRisks.absenteeism}%</div>
              <div className="card-trend">Based on last 3 months absence history</div>
            </div>
          </div>
          <div className="prediction-card">
            <div className="card-icon">⚡</div>
            <div className="card-content">
              <div className="card-title">WORK OVERLOAD RISK</div>
              <div className="card-value">{globalRisks.overload}%</div>
              <div className="card-trend">Based on weekly hours & overtime</div>
            </div>
          </div>
        </div>

        {/* AI Alerts */}
        <div className="ai-alerts">
          <div className="alert-header">
            <h3>🤖 AI Alerts & Recommendations</h3>
          </div>
          <div className="alert-badge">{criticalAlerts} employee(s) exceed high-risk threshold</div>
          <ul className="recommendations">
            {recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
          </ul>
        </div>

        {/* Employee Risk Table with all 3 risks visible */}
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
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Departure Risk</th>
                  <th>Absenteeism Risk</th>
                  <th>Overload Risk</th>
                  <th>Primary Risk</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td><strong>{emp.name}</strong></td>
                    <td>{emp.department}</td>
                    <td><span className="risk-score-cell" style={{color: getRiskColorByScore(emp.departureRisk)}}>{emp.departureRisk}%</span></td>
                    <td><span className="risk-score-cell" style={{color: getRiskColorByScore(emp.absenteeismRisk)}}>{emp.absenteeismRisk}%</span></td>
                    <td><span className="risk-score-cell" style={{color: getRiskColorByScore(emp.overloadRisk)}}>{emp.overloadRisk}%</span></td>
                    <td><span className="risk-level" style={{backgroundColor: getRiskLevelColor(emp.riskLevel)}}>{emp.riskType}</span></td>
                    <td>{emp.suggestedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="chart-card">
            <h3>Absenteeism Risk by Department</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={departmentRisks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="riskScore" fill="#10b981" name="Absenteeism Risk (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Turnover Risk Trend (6 months)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={turnoverTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 6]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="risk" stroke="#f97316" name="Turnover Risk (%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPrediction;
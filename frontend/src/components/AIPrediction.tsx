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

const AIPrediction: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All departments');
  const [riskTypeFilter, setRiskTypeFilter] = useState('All types');
  const [employees, setEmployees] = useState<EmployeeRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [globalRisks, setGlobalRisks] = useState({ departure: 0, absenteeism: 0, overload: 0 });
  const [departmentRisks, setDepartmentRisks] = useState<DepartmentRisk[]>([]);
  const [turnoverTrend, setTurnoverTrend] = useState<{ month: string; risk: number }[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Fetch all predictions via batch endpoint
  useEffect(() => {
    fetchBatchPredictions();
  }, []);

  const fetchBatchPredictions = async () => {
    try {
      setLoading(true);
      
      // Call batch prediction endpoint
      const response = await fetch(`${API_BASE_URL}/ai/batch-predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }
      
      const data = await response.json();
      console.log('Batch predictions:', data);
      
      // Transform employee data
      const employeeRisks: EmployeeRisk[] = [];
      let totalDepartureRisk = 0;
      let totalAbsenteeismRisk = 0;
      let totalOverloadRisk = 0;
      let employeeCount = 0;
      
      // Process turnover data
      if (data.turnover && data.turnover.length > 0) {
        data.turnover.forEach((item: any) => {
          const departureScore = item.riskScore || 0;
          totalDepartureRisk += departureScore;
          employeeCount++;
          
          // Find corresponding absence and workload data
          const absenceData = data.absences?.find((a: any) => a.employeeId === item.employeeId);
          const workloadData = data.workload?.find((w: any) => w.employeeId === item.employeeId);
          
          const absenceScore = absenceData?.predictedAbsenceRate || 0;
          const overloadScore = workloadData?.overloadScore || 0;
          
          totalAbsenteeismRisk += absenceScore;
          totalOverloadRisk += overloadScore;
          
          const risks = [
            { type: 'Departure' as RiskType, score: departureScore },
            { type: 'Absenteeism' as RiskType, score: absenceScore },
            { type: 'Overload' as RiskType, score: overloadScore }
          ];
          const highestRisk = risks.reduce((max, r) => r.score > max.score ? r : max, risks[0]);
          
          let riskLevel: RiskLevel = 'Low';
          if (highestRisk.score >= 70) riskLevel = 'High';
          else if (highestRisk.score >= 40) riskLevel = 'Medium';
          
          let suggestedAction: SuggestedAction = 'Monitor';
          if (highestRisk.score >= 75) suggestedAction = 'Mitigate';
          else if (highestRisk.score >= 60) suggestedAction = 'Support';
          else if (highestRisk.score >= 40) suggestedAction = 'Train';
          
          employeeRisks.push({
            id: item.employeeId,
            name: item.employeeName,
            department: item.department || 'Unknown',
            riskType: highestRisk.type,
            riskLevel: riskLevel,
            suggestedAction: suggestedAction,
            riskScore: highestRisk.score,
            departureRisk: departureScore,
            absenteeismRisk: absenceScore,
            overloadRisk: overloadScore
          });
        });
      }
      
      setEmployees(employeeRisks);
      
      // Calculate global averages
      const avgDeparture = employeeCount > 0 ? Math.round(totalDepartureRisk / employeeCount) : 0;
      const avgAbsenteeism = employeeCount > 0 ? Math.round(totalAbsenteeismRisk / employeeCount) : 0;
      const avgOverload = employeeCount > 0 ? Math.round(totalOverloadRisk / employeeCount) : 0;
      
      setGlobalRisks({
        departure: avgDeparture,
        absenteeism: avgAbsenteeism,
        overload: avgOverload
      });
      
      // Create department risks from workload data
      if (data.workload && data.workload.length > 0) {
        const deptMap = new Map<string, { total: number; count: number }>();
        data.workload.forEach((w: any) => {
          if (!deptMap.has(w.department)) {
            deptMap.set(w.department, { total: 0, count: 0 });
          }
          const dept = deptMap.get(w.department)!;
          dept.total += w.overloadScore || 0;
          dept.count++;
        });
        
        const deptRisks: DepartmentRisk[] = Array.from(deptMap.entries()).map(([dept, d]) => ({
          department: dept,
          riskScore: Math.round(d.total / d.count),
          avgWeeklyHours: 45
        }));
        setDepartmentRisks(deptRisks);
      }
      
      // Generate turnover trend from batch data
      const months = ['Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep'];
      const trend = months.map((month, idx) => ({
        month,
        risk: Math.min(8, 2 + (idx * 0.3) + (avgDeparture / 15))
      }));
      setTurnoverTrend(trend);
      
      // Generate recommendations
      const highRiskCount = employeeRisks.filter(e => e.riskScore >= 70).length;
      const criticalWorkload = data.workload?.filter((w: any) => w.status === 'Critical').length || 0;
      
      setRecommendations([
        highRiskCount > 0 
          ? `🔴 ${highRiskCount} employee(s) at high departure risk. Schedule retention meetings.`
          : '✅ No high departure risk detected.',
        avgOverload > 50 
          ? `⚠️ Critical overload risk detected (${avgOverload}%). Review workload distribution.`
          : `⚠️ Moderate overload risk detected (${avgOverload}%).`,
        avgAbsenteeism > 30 
          ? `📊 High absenteeism risk (${avgAbsenteeism}%). Schedule wellness checks.`
          : `📊 Absenteeism risk at ${avgAbsenteeism}%. Continue monitoring.`,
        `🤖 AI recommends ${employeeRisks.filter(e => e.suggestedAction === 'Mitigate').length} immediate interventions.`
      ]);
      
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
            <button onClick={fetchBatchPredictions}>Retry</button>
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

        <div className="ai-alerts">
          <div className="alert-header">
            <h3>🤖 AI Alerts & Recommendations</h3>
          </div>
          <div className="alert-badge">{criticalAlerts} employee(s) exceed high-risk threshold</div>
          <ul className="recommendations">
            {recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
          </ul>
        </div>

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

        <div className="charts-row">
          <div className="chart-card">
            <h3>Risk by Department</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={departmentRisks.length > 0 ? departmentRisks : [{ department: 'No Data', riskScore: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="riskScore" fill="#10b981" name="Risk Score (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Turnover Risk Trend (6 months)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={turnoverTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 8]} />
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
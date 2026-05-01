import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Navbar from './Navbar';
import '../style/Dashboard.css';

// Types pour les données
interface KpiData {
  absenceRate: number;
  turnoverRate: number;
  totalEmployees: number;
  overtimeHours: number;
}

interface MonthlyData {
  month: string;
  absence: number;
  turnover: number;
}

interface ReasonData {
  name: string;
  value: number;
  color: string;
}

interface TopEmployee {
  name: string;
  department: string;
  days?: number;
  hours?: number;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState<KpiData>({
    absenceRate: 0,
    turnoverRate: 0,
    totalEmployees: 0,
    overtimeHours: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [absenceReasons, setAbsenceReasons] = useState<ReasonData[]>([]);
  const [topAbsences, setTopAbsences] = useState<TopEmployee[]>([]);
  const [topOvertime, setTopOvertime] = useState<TopEmployee[]>([]);

  // Fonction pour récupérer toutes les données
  const fetchDashboardData = async () => {
    try {
      // Remplacer les URLs par vos endpoints réels
      const [kpiRes, monthlyRes, reasonsRes, topAbsRes, topOvertimeRes] = await Promise.all([
        fetch('/api/dashboard/kpi'),
        fetch('/api/dashboard/monthly'),
        fetch('/api/dashboard/absence-reasons'),
        fetch('/api/dashboard/top-absences'),
        fetch('/api/dashboard/top-overtime'),
      ]);

      if (!kpiRes.ok || !monthlyRes.ok || !reasonsRes.ok || !topAbsRes.ok || !topOvertimeRes.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const kpiData = await kpiRes.json();
      const monthlyData = await monthlyRes.json();
      const reasonsData = await reasonsRes.json();
      const topAbsencesData = await topAbsRes.json();
      const topOvertimeData = await topOvertimeRes.json();

      setKpi(kpiData);
      setMonthlyData(monthlyData);
      setAbsenceReasons(reasonsData);
      setTopAbsences(topAbsencesData);
      setTopOvertime(topOvertimeData);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      // Option : afficher un message d'erreur à l'utilisateur
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container">
          <div className="loading-spinner">Chargement des données...</div>
        </div>
      </div>
    );
  }

  // Définir des couleurs par défaut pour le camembert si non fournies
  const defaultColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'];
  const pieData = absenceReasons.map((item, idx) => ({
    ...item,
    color: item.color || defaultColors[idx % defaultColors.length]
  }));

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Tableau de bord RH</h1>
          <p>Votre démonstration de la situation du territoire</p>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-title">TAUX D'ABSENCE</div>
            <div className="kpi-value">{kpi.absenceRate} %</div>
            <div className="kpi-trend up">↗ +0,6 pt vs mois dernier</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">TAUX DE TURNOVER</div>
            <div className="kpi-value">{kpi.turnoverRate} %</div>
            <div className="kpi-trend down">↘ -0,3 pt vs mois dernier</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">EMPLOYÉS TOTAUX</div>
            <div className="kpi-value">{kpi.totalEmployees.toLocaleString()}</div>
            <div className="kpi-trend up">↗ +24 vs mois dernier</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">HEURES SUPPLÉMENTAIRES</div>
            <div className="kpi-value">{kpi.overtimeHours.toLocaleString()} h</div>
            <div className="kpi-trend up">↗ +8,2 % vs mois dernier</div>
          </div>
        </div>

        {/* Première ligne : Évolution mensuelle + Répartition des absences */}
        <div className="two-columns">
          <div className="chart-card">
            <h2>Évolution mensuelle</h2>
            <p className="chart-subtitle">Taux d'absence et de turnover sur 6 mois</p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 8]} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="absence" stroke="#ef4444" name="Taux d'absence" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="turnover" stroke="#3b82f6" name="Taux de turnover" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2>Répartition des absences</h2>
            <p className="chart-subtitle">Par motif</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {pieData.map(item => (
                <div key={item.name} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                  <span className="legend-value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deuxième ligne : Top absences et Top overtime */}
        <div className="two-columns">
          <div className="list-card">
            <h2>Top absences</h2>
            <div className="ranking-list">
              {topAbsences.map((item, idx) => (
                <div key={idx} className="ranking-item">
                  <div className="rank-number">{idx + 1}</div>
                  <div className="rank-info">
                    <div className="rank-name">{item.name}</div>
                    <div className="rank-dept">{item.department}</div>
                  </div>
                  <div className="rank-value">{item.days} d</div>
                </div>
              ))}
            </div>
          </div>

          <div className="list-card">
            <h2>Top overtime</h2>
            <div className="ranking-list">
              {topOvertime.map((item, idx) => (
                <div key={idx} className="ranking-item">
                  <div className="rank-number">{idx + 1}</div>
                  <div className="rank-info">
                    <div className="rank-name">{item.name}</div>
                    <div className="rank-dept">{item.department}</div>
                  </div>
                  <div className="rank-value">{item.hours} h</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
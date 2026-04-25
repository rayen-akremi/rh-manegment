import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Navbar from './Navbar';
import '../style/Dashboard.css';

// Données KPI
const kpiData = {
  absenceRate: 5.4,
  turnoverRate: 1.9,
  totalEmployees: 1248,
  overtimeHours: 3412,
};

// Évolution mensuelle sur 6 MOIS (juillet à décembre)
const monthlyData6 = [
  { month: 'Juil', absence: 5.3, turnover: 1.9 },
  { month: 'Août', absence: 5.5, turnover: 2.1 },
  { month: 'Sep', absence: 5.4, turnover: 2.0 },
  { month: 'Oct', absence: 5.6, turnover: 2.2 },
  { month: 'Nov', absence: 5.5, turnover: 2.1 },
  { month: 'Déc', absence: 5.4, turnover: 1.9 },
];

// Répartition des absences par motif (camembert)
const absenceReasons = [
  { name: 'Maladie', value: 48, color: '#ef4444' },
  { name: 'Congés payés', value: 32, color: '#3b82f6' },
  { name: 'Non justifiée', value: 12, color: '#f59e0b' },
  { name: 'Familial', value: 8, color: '#10b981' },
];

// Top absences
const topAbsences = [
  { name: 'Maya Robinson', department: 'Engineering', days: 14 },
  { name: 'Lucas Bernard', department: 'Sales', days: 12 },
  { name: 'Hana Tanaka', department: 'Support', days: 11 },
  { name: 'Diego Alvarez', department: 'Marketing', days: 10 },
  { name: 'Priya Shah', department: 'Finance', days: 9 },
];

// Top overtime
const topOvertime = [
  { name: 'Noah Williams', department: 'Engineering', hours: 64 },
  { name: 'Aïcha Diallo', department: 'Operations', hours: 58 },
  { name: 'Jonas Becker', department: 'Engineering', hours: 52 },
  { name: 'Sara Lindqvist', department: 'Product', hours: 49 },
  { name: 'Omar Haddad', department: 'IT', hours: 47 },
];

const Dashboard: React.FC = () => {
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
            <div className="kpi-value">{kpiData.absenceRate} %</div>
            <div className="kpi-trend up">↗ +0,6 pt vs mois dernier</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">TAUX DE TURNOVER</div>
            <div className="kpi-value">{kpiData.turnoverRate} %</div>
            <div className="kpi-trend down">↘ -0,3 pt vs mois dernier</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">EMPLOYÉS TOTAUX</div>
            <div className="kpi-value">{kpiData.totalEmployees.toLocaleString()}</div>
            <div className="kpi-trend up">↗ +24 vs mois dernier</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">HEURES SUPPLÉMENTAIRES</div>
            <div className="kpi-value">{kpiData.overtimeHours.toLocaleString()} h</div>
            <div className="kpi-trend up">↗ +8,2 % vs mois dernier</div>
          </div>
        </div>

        {/* Première ligne : Évolution mensuelle (6 mois) + Répartition des absences côte à côte */}
        <div className="two-columns">
          <div className="chart-card">
            <h2>Évolution mensuelle</h2>
            <p className="chart-subtitle">Taux d'absence et de turnover sur 6 mois</p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyData6} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
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
                  data={absenceReasons}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                >
                  {absenceReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {absenceReasons.map(item => (
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
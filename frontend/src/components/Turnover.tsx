import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import Navbar from './Navbar';
import '../style/Turnover.css';

// Données KPI
const kpiData = {
  turnoverRate: 2.4,
  departures: 163,
  newHires: 171,
  netChange: 8,
};

// Évolution mensuelle du taux de turnover (seulement)
const monthlyData = [
  { month: 'Jan', taux: 1.8 },
  { month: 'Fév', taux: 2.0 },
  { month: 'Mar', taux: 2.2 },
  { month: 'Avr', taux: 2.1 },
  { month: 'Mai', taux: 2.3 },
  { month: 'Juin', taux: 2.4 },
  { month: 'Juil', taux: 2.5 },
  { month: 'Août', taux: 2.6 },
  { month: 'Sep', taux: 2.5 },
  { month: 'Oct', taux: 2.4 },
  { month: 'Nov', taux: 2.3 },
  { month: 'Déc', taux: 2.4 },
];

// Turnover par département (inchangé)
const departmentTurnover = [
  { dept: 'IT', taux: 4.2 },
  { dept: 'Ventes', taux: 3.8 },
  { dept: 'Marketing', taux: 2.5 },
  { dept: 'Finance', taux: 1.9 },
  { dept: 'RH', taux: 1.5 },
  { dept: 'Production', taux: 2.0 },
];

// Motifs de départ (inchangé)
const departureReasons = [
  { name: 'Démission', value: 48, color: '#ef4444' },
  { name: 'Fin de contrat', value: 25, color: '#3b82f6' },
  { name: 'Retraite', value: 15, color: '#f59e0b' },
  { name: 'Licenciement', value: 12, color: '#10b981' },
];

// Registre des départs (inchangé)
const registreData = [
  { id: 'EMP-1042', employee: 'Sarah Lambert', department: 'Marketing', date: '12 mars 2026', reason: 'Démission' },
  { id: 'EMP-0987', employee: 'Marc Dubois', department: 'IT', date: '08 mars 2026', reason: 'Démission' },
  { id: 'EMP-1120', employee: 'Léa Bernard', department: 'Finance', date: '28 févr. 2026', reason: 'Fin de contrat' },
  { id: 'EMP-0875', employee: 'Antoine Petit', department: 'Production', date: '22 févr. 2026', reason: 'Retraite' },
  { id: 'EMP-1199', employee: 'Tom Moreau', department: 'Ventes', date: '15 févr. 2026', reason: 'Démission' },
  { id: 'EMP-0712', employee: 'Inès Girard', department: 'RH', date: '10 févr. 2026', reason: 'Licenciement' },
];

const Turnover: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  const displayedRegistre = showAll ? registreData : registreData.slice(0, 5);

  return (
    <div>
      <Navbar />
      <div className="turnover-page">
        <div className="page-header">
          <h1>Turnover</h1>
          <p>Analyse des départs et des flux d'entrée / sortie</p>
        </div>

        {/* KPI Cards (inchangées) */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-title">TAUX DE TURNOVER</div>
            <div className="kpi-value">{kpiData.turnoverRate} %</div>
            <div className="kpi-trend up">↗ +0,5 pt vs mois dernier</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">DÉPARTS (PÉRIODE)</div>
            <div className="kpi-value">{kpiData.departures}</div>
            <div className="kpi-trend up">↗ +12 vs mois dernier</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">NOUVELLES EMBAUCHES</div>
            <div className="kpi-value">{kpiData.newHires}</div>
            <div className="kpi-trend up">↗ +18 vs mois dernier</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">SOLDE NET</div>
            <div className="kpi-value">{kpiData.netChange > 0 ? `+${kpiData.netChange}` : kpiData.netChange}</div>
            <div className="kpi-trend neutral">vs -4 année préc.</div>
          </div>
        </div>

        {/* Ligne 1 : Tendance du turnover (seulement taux) + Motifs de départ */}
        <div className="two-columns">
          <div className="chart-card">
            <h2>Tendance du turnover</h2>
            <p className="chart-subtitle">Taux mensuel sur 12 mois</p>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 6]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="taux" stroke="#ef4444" name="Taux de turnover %" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2>Motifs de départ</h2>
            <p className="chart-subtitle">Répartition par cause</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={departureReasons}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                >
                  {departureReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {departureReasons.map(item => (
                <div key={item.name} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                  <span className="legend-value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ligne 2 : Turnover par département + IA Insights (inchangés) */}
        <div className="two-columns">
          <div className="chart-card">
            <h2>Turnover par département</h2>
            <p className="chart-subtitle">Comparaison du taux de rotation (%)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentTurnover} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dept" />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="taux" fill="#f97316" name="Taux Turnover %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="ai-insights">
            <h3>🤖 Insights IA & alertes</h3>
            <p className="section-desc">Recommandations de rétention</p>
            <div className="insight-card critical">
              <span className="insight-icon">⚠️</span>
              <div>
                <strong>IT au-dessus du seuil</strong>
                <p>Taux 4,2% &gt; seuil 3%. Risque élevé de cascade.</p>
              </div>
            </div>
            <div className="insight-card warning">
              <span className="insight-icon">📈</span>
              <div>
                <strong>Tendance Ventes en hausse</strong>
                <p>+18% de démissions sur 3 mois. Revoir la grille salariale.</p>
              </div>
            </div>
            <div className="insight-card action">
              <span className="insight-icon">💡</span>
              <div>
                <strong>Action recommandée</strong>
                <p>Lancer un programme de mentorat IT et plan de formation Marketing.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registre des départs (inchangé) */}
        <div className="registre-section">
          <div className="registre-header">
            <h2>Registre des départs</h2>
            <span>{registreData.length} enregistrements</span>
          </div>
          <div className="table-wrapper">
            <table className="registre-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employé</th>
                  <th>Département</th>
                  <th>Date de départ</th>
                  <th>Motif</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedRegistre.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>{emp.employee}</td>
                    <td>{emp.department}</td>
                    <td>{emp.date}</td>
                    <td>{emp.reason}</td>
                    <td className="action-icons">
                      <button className="icon-btn approve">✅</button>
                      <button className="icon-btn reject">❌</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAll && registreData.length > 5 && (
            <button className="show-more-btn" onClick={() => setShowAll(true)}>Voir tout</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Turnover;
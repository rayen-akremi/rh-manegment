import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import Navbar from './Navbar';
import '../style/Turnover.css';

interface TurnoverDeparture {
  _id: string;
  month?: string;
  employeeName: string;
  position?: string;
  department?: string;
  hireDate?: string;
  departureDate?: string;
  seniority?: string;
  gender?: string;
  organizationType?: string;
  college?: string;
  workforceType?: string;
  departureReason?: string;
  departureCause?: string;
  cumulative?: number;
  sourceYear?: number;
}

interface TurnoverSummary {
  totalDepartures: number;
  monthly: { month: string; departures: number; turnoverRate: number; year: number }[];
  byDepartment: { name: string; value: number }[];
  byReason: { name: string; value: number }[];
  byCause: { name: string; value: number }[];
  byWorkforceType: { name: string; value: number }[];
}

type TurnoverForm = {
  month: string;
  employeeName: string;
  position: string;
  department: string;
  hireDate: string;
  departureDate: string;
  seniority: string;
  gender: string;
  organizationType: string;
  college: string;
  workforceType: string;
  departureReason: string;
  departureCause: string;
  cumulative: string;
};

const emptySummary: TurnoverSummary = {
  totalDepartures: 0,
  monthly: [],
  byDepartment: [],
  byReason: [],
  byCause: [],
  byWorkforceType: []
};

const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

const emptyTurnoverForm: TurnoverForm = {
  month: '',
  employeeName: '',
  position: '',
  department: '',
  hireDate: '',
  departureDate: '',
  seniority: '',
  gender: '',
  organizationType: '',
  college: '',
  workforceType: '',
  departureReason: '',
  departureCause: '',
  cumulative: ''
};

const formatDate = (date?: string) => {
  if (!date) return '-';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('fr-FR');
};

const Turnover: React.FC = () => {
  const [departures, setDepartures] = useState<TurnoverDeparture[]>([]);
  const [summary, setSummary] = useState<TurnoverSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [yearFilter, setYearFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTurnover, setNewTurnover] = useState<TurnoverForm>(emptyTurnoverForm);

  const selectedYear = yearFilter === 'All' ? '' : yearFilter;

  const fetchTurnoverData = useCallback(async () => {
    try {
      setLoading(true);
      const query = selectedYear ? `?year=${selectedYear}` : '';
      const [departuresRes, summaryRes] = await Promise.all([
        fetch(`/api/turnover-history/departures${query}`),
        fetch(`/api/turnover-history/departures/summary${query}`)
      ]);

      if (!departuresRes.ok || !summaryRes.ok) throw new Error('Unable to load turnover data');

      const [departuresData, summaryData] = await Promise.all([
        departuresRes.json(),
        summaryRes.json()
      ]);

      setDepartures(departuresData || []);
      setSummary({ ...emptySummary, ...(summaryData || {}) });
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load turnover data');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchTurnoverData();
  }, [fetchTurnoverData]);

  const availableYears = useMemo(() => {
    const years = new Set(departures.map((item) => item.sourceYear).filter(Boolean));
    return ['All', ...Array.from(years).sort((a, b) => Number(b) - Number(a)).map(String)];
  }, [departures]);

  const displayedDepartures = showAll ? departures : departures.slice(0, 8);
  const topDepartment = summary.byDepartment[0]?.name || '-';
  const topReason = summary.byReason[0]?.name || '-';
  const topCause = summary.byCause[0]?.name || '-';

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setImporting(true);
      const res = await fetch('/api/turnover-history/departures/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Import failed');
      await fetchTurnoverData();
      alert(data.message);
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const updateTurnoverField = (field: keyof TurnoverForm, value: string) => {
    setNewTurnover((current) => ({ ...current, [field]: value }));
  };

  const handleAddTurnover = async () => {
    if (!newTurnover.employeeName.trim()) {
      alert('Nom et Prénom is required');
      return;
    }
    if (!newTurnover.departureDate) {
      alert('Date de départ is required');
      return;
    }

    const payload = {
      ...newTurnover,
      cumulative: Number(newTurnover.cumulative) || 0
    };

    try {
      const res = await fetch('/api/turnover-history/departures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Unable to add turnover');
      setShowAddModal(false);
      setNewTurnover(emptyTurnoverForm);
      await fetchTurnoverData();
    } catch (err: any) {
      alert(`Add turnover error: ${err.message}`);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="turnover-page">
        <div className="page-header turnover-header">
          <div>
            <h1>Turnover</h1>
            <p>Analyse des departs avec les champs du fichier Turnover 2026.</p>
          </div>
          <div className="turnover-actions">
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              {availableYears.map((year) => <option key={year}>{year}</option>)}
            </select>
            <label className="btn-import">
              {importing ? 'Importing...' : 'Import ODS/XLSX'}
              <input type="file" accept=".ods,.xlsx,.xls" onChange={handleImport} hidden disabled={importing} />
            </label>
            <button className="btn-add-turnover" onClick={() => setShowAddModal(true)}>Add turnover</button>
          </div>
        </div>

        {error && <div className="turnover-error">{error}</div>}
        {loading ? (
          <div className="turnover-loading">Loading turnover data...</div>
        ) : (
          <>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-title">DEPARTS</div>
                <div className="kpi-value">{summary.totalDepartures}</div>
                <div className="kpi-trend neutral">records imported</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-title">TOP DEPARTMENT</div>
                <div className="kpi-value compact">{topDepartment}</div>
                <div className="kpi-trend neutral">{summary.byDepartment[0]?.value || 0} departures</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-title">TOP MOTIF</div>
                <div className="kpi-value compact">{topReason}</div>
                <div className="kpi-trend neutral">{summary.byReason[0]?.value || 0} records</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-title">TOP CAUSE</div>
                <div className="kpi-value compact">{topCause}</div>
                <div className="kpi-trend neutral">{summary.byCause[0]?.value || 0} records</div>
              </div>
            </div>

            <div className="two-columns">
              <div className="chart-card">
                <h2>Tendance des departs</h2>
                <p className="chart-subtitle">Nombre de departs par mois</p>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={summary.monthly} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="departures" stroke="#ef4444" name="Departs" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h2>Causes de départ</h2>
                <p className="chart-subtitle">Répartition par cause de départ</p>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={summary.byCause} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {summary.byCause.map((entry, index) => (
                        <Cell key={entry.name} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="two-columns">
              <div className="chart-card">
                <h2>Turnover par departement</h2>
                <p className="chart-subtitle">Volume de departs par departement</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={summary.byDepartment} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#f97316" name="Departs" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="ai-insights">
                <h3>Insights IA & alertes</h3>
                <p className="section-desc">Champs synchronises: motif, cause, type d'effectif, college et organisation.</p>
                <div className="insight-card critical">
                  <span className="insight-icon">!</span>
                  <div>
                    <strong>{topDepartment}</strong>
                    <p>Departement avec le plus de departs dans la periode selectionnee.</p>
                  </div>
                </div>
                <div className="insight-card warning">
                  <span className="insight-icon">i</span>
                  <div>
                    <strong>{topReason}</strong>
                    <p>Motif dominant a surveiller dans les predictions de risque.</p>
                  </div>
                </div>
                <div className="insight-card action">
                  <span className="insight-icon">+</span>
                  <div>
                    <strong>{topCause}</strong>
                    <p>Cause principale integree au service AI pour enrichir les facteurs de risque.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="registre-section">
              <div className="registre-header">
                <h2>Registre des departs</h2>
                <span>{departures.length} enregistrements</span>
              </div>
              <div className="table-wrapper">
                <table className="registre-table turnover-wide-table">
                  <thead>
                    <tr>
                      <th>Mois</th>
                      <th>Nom et Prénom</th>
                      <th>Position</th>
                      <th>Département</th>
                      <th>Date d'embauche</th>
                      <th>Date de départ</th>
                      <th>Ancienneté</th>
                      <th>Genre</th>
                      <th>Type d'organisation</th>
                      <th>Collège</th>
                      <th>Type d'effectif</th>
                      <th>Motif de départ</th>
                      <th>Cause de départ</th>
                      <th>Cumul</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedDepartures.map((departure) => (
                      <tr key={departure._id}>
                        <td>{formatDate(departure.month)}</td>
                        <td>{departure.employeeName}</td>
                        <td>{departure.position || '-'}</td>
                        <td>{departure.department || '-'}</td>
                        <td>{formatDate(departure.hireDate)}</td>
                        <td>{formatDate(departure.departureDate)}</td>
                        <td>{departure.seniority || '-'}</td>
                        <td>{departure.gender || '-'}</td>
                        <td>{departure.organizationType || '-'}</td>
                        <td>{departure.college || '-'}</td>
                        <td>{departure.workforceType || '-'}</td>
                        <td>{departure.departureReason || '-'}</td>
                        <td>{departure.departureCause || '-'}</td>
                        <td>{departure.cumulative || '-'}</td>
                      </tr>
                    ))}
                    {displayedDepartures.length === 0 && (
                      <tr>
                        <td colSpan={14} className="empty-row">No turnover departures imported yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {!showAll && departures.length > 8 && (
                <button className="show-more-btn" onClick={() => setShowAll(true)}>Voir tout</button>
              )}
            </div>
          </>
        )}

        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="turnover-modal" onClick={(event) => event.stopPropagation()}>
              <div className="turnover-modal-header">
                <div>
                  <h2>Add new turnover</h2>
                  <p>Use the same fields and order as the imported file.</p>
                </div>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>x</button>
              </div>

              <div className="turnover-form-grid">
                <div className="form-group">
                  <label>Mois</label>
                  <input type="date" value={newTurnover.month} onChange={(e) => updateTurnoverField('month', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Nom et Prénom *</label>
                  <input value={newTurnover.employeeName} onChange={(e) => updateTurnoverField('employeeName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input value={newTurnover.position} onChange={(e) => updateTurnoverField('position', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Département</label>
                  <input value={newTurnover.department} onChange={(e) => updateTurnoverField('department', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Date d'embauche</label>
                  <input type="date" value={newTurnover.hireDate} onChange={(e) => updateTurnoverField('hireDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Date de départ *</label>
                  <input type="date" value={newTurnover.departureDate} onChange={(e) => updateTurnoverField('departureDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Ancienneté</label>
                  <input value={newTurnover.seniority} onChange={(e) => updateTurnoverField('seniority', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Genre</label>
                  <input value={newTurnover.gender} onChange={(e) => updateTurnoverField('gender', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Type d'organisation</label>
                  <input value={newTurnover.organizationType} onChange={(e) => updateTurnoverField('organizationType', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Collège</label>
                  <input value={newTurnover.college} onChange={(e) => updateTurnoverField('college', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Type d'effectif</label>
                  <input value={newTurnover.workforceType} onChange={(e) => updateTurnoverField('workforceType', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Motif de départ</label>
                  <input value={newTurnover.departureReason} onChange={(e) => updateTurnoverField('departureReason', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Cause de départ</label>
                  <input value={newTurnover.departureCause} onChange={(e) => updateTurnoverField('departureCause', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Cumul</label>
                  <input type="number" value={newTurnover.cumulative} onChange={(e) => updateTurnoverField('cumulative', e.target.value)} />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleAddTurnover}>Add turnover</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Turnover;

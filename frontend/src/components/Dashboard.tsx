import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  Users, Clock, TrendingUp, TrendingDown, Calendar, 
  Award, BarChart3, PieChart as PieChartIcon, Building2
} from 'lucide-react';
import Navbar from './Navbar';
import '../style/Dashboard.css';

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

interface DeptData {
  name: string;
  value: number;
  color: string;
}

interface OvertimeDeptData {
  name: string;
  hours: number;
  employees: number;
  color: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

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
  const [employeesByDept, setEmployeesByDept] = useState<DeptData[]>([]);
  const [overtimeByDept, setOvertimeByDept] = useState<OvertimeDeptData[]>([]);
  const [deptBarChartKey, setDeptBarChartKey] = useState(0);

  // Fetch real data from backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch enhanced KPI data with AI insights
      const kpiRes = await fetch('/api/dashboard/kpi');
      if (kpiRes.ok) {
        const kpiData = await kpiRes.json();
        setKpi(kpiData);
      }
      
      // Fetch monthly data
      const monthlyRes = await fetch('/api/dashboard/monthly');
      if (monthlyRes.ok) {
        const monthlyDataRaw = await monthlyRes.json();
        setMonthlyData(monthlyDataRaw);
      }
      
      // Fetch absence reasons
      const reasonsRes = await fetch('/api/dashboard/absence-reasons');
      if (reasonsRes.ok) {
        const reasonsData = await reasonsRes.json();
        if (reasonsData.length > 0) {
          setAbsenceReasons(reasonsData);
        }
      }
      
      // Fetch top absences
      const topAbsRes = await fetch('/api/dashboard/top-absences');
      if (topAbsRes.ok) {
        const topAbsData = await topAbsRes.json();
        if (topAbsData.length > 0) {
          setTopAbsences(topAbsData);
        }
      }
      
      // Fetch top overtime
      const topOvertimeRes = await fetch('/api/dashboard/top-overtime');
      if (topOvertimeRes.ok) {
        const topOvertimeData = await topOvertimeRes.json();
        if (topOvertimeData.length > 0) {
          setTopOvertime(topOvertimeData);
        }
      }

      // Fetch employees by department
      const deptRes = await fetch('/api/dashboard/employees-by-department');
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        if (deptData.length > 0) {
          setEmployeesByDept(deptData);
          setDeptBarChartKey(prev => prev + 1);
        }
      }

      // Fetch overtime by department
      const overtimeDeptRes = await fetch('/api/dashboard/overtime-by-department');
      if (overtimeDeptRes.ok) {
        const overtimeDeptData = await overtimeDeptRes.json();
        if (overtimeDeptData.length > 0) {
          setOvertimeByDept(overtimeDeptData);
        }
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh dashboard data periodically
  useEffect(() => {
    fetchDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    window.addEventListener('monthly-recap-imported', fetchDashboardData);
    window.addEventListener('turnover-imported', fetchDashboardData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('monthly-recap-imported', fetchDashboardData);
      window.removeEventListener('turnover-imported', fetchDashboardData);
    };
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

  const stats = [
    {
      title: "TAUX D'ABSENCE",
      value: `${kpi.absenceRate}%`,
      trend: "+0.6",
      trendUp: true,
      icon: <Calendar size={24} />,
      color: "#ef4444"
    },
    {
      title: "TAUX DE TURNOVER",
      value: `${kpi.turnoverRate}%`,
      trend: "-0.3",
      trendUp: false,
      icon: <Users size={24} />,
      color: "#3b82f6"
    },
    {
      title: "EMPLOYÉS TOTAUX",
      value: kpi.totalEmployees.toLocaleString(),
      trend: "+24",
      trendUp: true,
      icon: <Award size={24} />,
      color: "#10b981"
    },
    {
      title: "HEURES SUPPLÉMENTAIRES",
      value: `${kpi.overtimeHours.toLocaleString()} h`,
      trend: "+8.2%",
      trendUp: true,
      icon: <Clock size={24} />,
      color: "#f59e0b"
    }
  ];

  // Custom tooltip for bar charts
  const DeptBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.name}</p>
          <p className="tooltip-value">{payload[0].value} employés</p>
        </div>
      );
    }
    return null;
  };

  const OvertimeBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.name}</p>
          <p className="tooltip-value">{payload[0].value}h supplémentaires</p>
          <p className="tooltip-sub">{payload[0].payload.employees} employés</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="dashboard-inner"
        >
          <motion.div variants={itemVariants} className="dashboard-header">
            <h1 className="gradient-text">Tableau de bord RH</h1>
          </motion.div>

          <motion.div variants={itemVariants} className="stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.title}</div>
                <div className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`}>
                  {stat.trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {stat.trend} vs mois dernier
                </div>
              </div>
            ))}
          </motion.div>

          {/* First charts row: Monthly evolution + Absence reasons pie */}
          <motion.div variants={itemVariants} className="charts-row">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Évolution mensuelle</h3>
                  <p>Taux d'absence et de turnover sur 6 mois</p>
                </div>
                <BarChart3 size={20} className="chart-icon" />
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData.length > 0 ? monthlyData : [
                    { month: 'Jan', absence: 0, turnover: 0 },
                    { month: 'Fév', absence: 0, turnover: 0 },
                    { month: 'Mar', absence: 0, turnover: 0 },
                    { month: 'Avr', absence: 0, turnover: 0 },
                    { month: 'Mai', absence: 0, turnover: 0 },
                    { month: 'Juin', absence: 0, turnover: 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" />
                    <YAxis tickFormatter={(v) => `${v}%`} stroke="var(--text-muted)" />
                    <Tooltip 
                      contentStyle={{ background: 'var(--card-bg)', border: 'none', borderRadius: '12px' }}
                      formatter={(value) => `${value}%`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="absence" stroke="#ef4444" name="Taux d'absence" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} />
                    <Line type="monotone" dataKey="turnover" stroke="#3b82f6" name="Taux de turnover" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Répartition des absences</h3>
                  <p>Par motif</p>
                </div>
                <PieChartIcon size={20} className="chart-icon" />
              </div>
              <div className="pie-container">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={absenceReasons.length > 0 ? absenceReasons : [{ name: 'Aucune donnée', value: 100, color: '#cbd5e1' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => percent ? `${name} ${(percent * 100).toFixed(0)}%` : name}
                      labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                    >
                      {(absenceReasons.length > 0 ? absenceReasons : [{ name: 'Aucune donnée', value: 100, color: '#cbd5e1' }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
                {absenceReasons.length > 0 && (
                  <div className="pie-legend">
                    {absenceReasons.map(item => (
                      <div key={item.name} className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                        <span>{item.name}</span>
                        <span className="legend-value">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Second charts row: Employees by dept + Overtime by dept */}
          <motion.div variants={itemVariants} className="charts-row">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Employés par département</h3>
                  <p>Répartition des effectifs</p>
                </div>
                <Building2 size={20} className="chart-icon" />
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart 
                    key={deptBarChartKey}
                    data={employeesByDept.length > 0 ? employeesByDept : [{ name: 'Aucune donnée', value: 0, color: '#cbd5e1' }]} 
                    layout="vertical"
                    margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" />
                    <YAxis type="category" dataKey="name" stroke="var(--text-muted)" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip content={<DeptBarTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                      {employeesByDept.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Heures supplémentaires par département</h3>
                  <p>Volume d'heures supplémentaires</p>
                </div>
                <Clock size={20} className="chart-icon" />
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart 
                    data={overtimeByDept.length > 0 ? overtimeByDept : [{ name: 'Aucune donnée', hours: 0, employees: 0, color: '#cbd5e1' }]}
                    layout="vertical"
                    margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" />
                    <YAxis type="category" dataKey="name" stroke="var(--text-muted)" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip content={<OvertimeBarTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="hours" radius={[0, 6, 6, 0]} barSize={24}>
                      {overtimeByDept.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lists-row">
            <div className="list-card">
              <h3>🏆 Top absences</h3>
              <div className="rank-list">
                {topAbsences.length > 0 ? topAbsences.map((item, idx) => (
                  <div key={idx} className="rank-item">
                    <div className="rank-number">{idx + 1}</div>
                    <div className="rank-info">
                      <div className="rank-name">{item.name}</div>
                      <div className="rank-dept">{item.department}</div>
                    </div>
                    <div className="rank-value">{item.days} jours</div>
                  </div>
                )) : (
                  <div className="no-data">Aucune donnée disponible</div>
                )}
              </div>
            </div>

            <div className="list-card">
              <h3>⚡ Top overtime</h3>
              <div className="rank-list">
                {topOvertime.length > 0 ? topOvertime.map((item, idx) => (
                  <div key={idx} className="rank-item">
                    <div className="rank-number">{idx + 1}</div>
                    <div className="rank-info">
                      <div className="rank-name">{item.name}</div>
                      <div className="rank-dept">{item.department}</div>
                    </div>
                    <div className="rank-value">{item.hours} heures</div>
                  </div>
                )) : (
                  <div className="no-data">Aucune donnée disponible</div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

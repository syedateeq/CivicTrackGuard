import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, AlertTriangle, CheckCircle, Activity, Users, 
  Loader2, ArrowRight, TrendingUp, Clock, Zap 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { formatDate, getStatusBadgeClass, getSeverityBadgeClass, timeAgo } from '../utils/helpers';

const SEVERITY_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="stat-card rounded-2xl"
  >
    <div className={`stat-icon ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black text-white mt-0.5">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 border border-white/10 text-sm">
        <p className="font-semibold text-white">{label || payload[0]?.name}</p>
        <p className="text-primary-400">{payload[0]?.value} issues</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [severity, setSeverity] = useState([]);
  const [category, setCategory] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, sevRes, catRes, recentRes] = await Promise.allSettled([
          api.get('/dashboard/stats'),
          api.get('/dashboard/severity'),
          api.get('/dashboard/category'),
          api.get('/issues/page?page=0&size=6'),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (sevRes.status === 'fulfilled') setSeverity(sevRes.value.data || []);
        if (catRes.status === 'fulfilled') setCategory(catRes.value.data || []);
        if (recentRes.status === 'fulfilled') {
          const d = recentRes.value.data;
          setRecent(Array.isArray(d) ? d : (d?.content || []));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary-500 w-12 h-12 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: FileText, label: 'Total Reports', value: stats?.totalIssues, color: 'bg-blue-500/15 text-blue-400' },
    { icon: Clock, label: 'Pending', value: stats?.pendingIssues, color: 'bg-amber-500/15 text-amber-400' },
    { icon: Activity, label: 'In Progress', value: stats?.inProgressIssues, color: 'bg-purple-500/15 text-purple-400' },
    { icon: CheckCircle, label: 'Resolved', value: stats?.resolvedIssues, color: 'bg-emerald-500/15 text-emerald-400' },
    { icon: AlertTriangle, label: 'High Severity', value: stats?.highSeverityIssues, color: 'bg-red-500/15 text-red-400' },
    { icon: Users, label: 'Citizens', value: stats?.totalUsers, color: 'bg-teal-500/15 text-teal-400' },
  ];

  const pieData = severity.map(s => ({
    name: s.severity,
    value: Number(s.count),
    color: SEVERITY_COLORS[s.severity] || '#64748b'
  }));

  const barData = category.map(c => ({
    name: (c.category || '').replace('_', ' '),
    value: Number(c.count)
  }));

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Good to see you, <span className="text-white font-medium">{user?.name?.split(' ')[0]}</span>. 
          Here's what's happening in your city.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass rounded-2xl p-5 border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div className="text-2xl font-black text-white">{s.value ?? 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-xl"
        >
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-400" /> Issues by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Severity Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-xl"
        >
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <Zap size={16} className="text-amber-400" /> Severity Distribution
          </h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
          )}
        </motion.div>
      </div>

      {/* Recent Issues */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass rounded-2xl border border-white/5 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Recent Reports</h3>
          <Link to="/issues" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 uppercase tracking-wider">
              <tr className="border-b border-white/5">
                <th className="px-6 py-3">Issue</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Severity</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.length > 0 ? recent.map((issue) => (
                <tr key={issue.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <Link to={`/issues/${issue.id}`}
                      className="text-sm font-medium text-slate-200 group-hover:text-primary-400 transition-colors line-clamp-1 max-w-48">
                      {issue.title}
                    </Link>
                    <p className="text-xs text-slate-600 mt-0.5">{issue.reporterName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                      {issue.category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getStatusBadgeClass(issue.status)}>
                      {issue.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getSeverityBadgeClass(issue.severity)}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {timeAgo(issue.createdAt)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600 text-sm">
                    No issues yet. <Link to="/issues/new" className="text-primary-400">Be the first to report one.</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;

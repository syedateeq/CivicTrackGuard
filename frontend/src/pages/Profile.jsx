import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { User, Star, FileText, MessageSquare, Loader2, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getStatusBadgeClass, getSeverityBadgeClass, formatDate } from '../utils/helpers';

const getBadge = (points) => {
  if (points >= 300) return { label: '🏆 Civic Champion', color: 'text-yellow-400' };
  if (points >= 150) return { label: '⭐ Community Hero', color: 'text-purple-400' };
  if (points >= 80)  return { label: '🌟 Active Citizen', color: 'text-blue-400' };
  if (points >= 30)  return { label: '🌱 Rising Contributor', color: 'text-emerald-400' };
  return { label: '💚 Contributor', color: 'text-slate-400' };
};

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        await refreshUser();
        const res = await api.get('/api/issues/me');
        const myIssuesData = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        setMyIssues(myIssuesData);
      } catch (err) {
        console.error("Failed to fetch my issues", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.userId]);

  const badge = getBadge(user?.points || 0);

  return (
    <div className="max-w-3xl mx-auto pb-10 space-y-6">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your civic engagement stats</p>
      </div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 border border-white/5 text-center transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 group">
        <div className="w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl font-black text-white shadow-xl group-hover:scale-105 transition-transform duration-300"
          style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <h2 className="text-2xl font-black text-white">{user?.name}</h2>
        <p className="text-slate-500 text-sm mt-1">{user?.email}</p>
        
        <div className={`mt-3 text-lg font-bold ${badge.color}`}>{badge.label}</div>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 border border-white/5 hover:bg-white/5 transition-colors">
            <div className="text-2xl font-black text-white">{user?.points ?? 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Points</div>
          </div>
          <div className="glass rounded-xl p-4 border border-white/5 hover:bg-white/5 transition-colors">
            <div className="text-2xl font-black text-white">{myIssues.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Issues Filed</div>
          </div>
          <div className="glass rounded-xl p-4 border border-white/5 hover:bg-white/5 transition-colors">
            <div className="text-2xl font-black text-white capitalize">{user?.role?.toLowerCase()}</div>
            <div className="text-xs text-slate-500 mt-0.5">Account Type</div>
          </div>
        </div>
      </motion.div>

      {/* My Issues */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <FileText size={16} className="text-primary-400" /> My Reported Issues
          </h3>
          <Link to="/issues/new" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
            + Report New
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary-500 w-8 h-8" />
          </div>
        ) : myIssues.length === 0 ? (
          <div className="p-12 text-center text-slate-600 text-sm">
            You haven't reported any issues yet.{' '}
            <Link to="/issues/new" className="text-primary-400 hover:underline">Report your first issue</Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {myIssues.map(issue => (
              <Link to={`/issues/${issue.id}`} key={issue.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
                    {issue.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{formatDate(issue.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={getStatusBadgeClass(issue.status)}>{issue.status?.replace('_', ' ')}</span>
                  <span className={getSeverityBadgeClass(issue.severity)}>{issue.severity}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

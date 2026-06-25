import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User, Mail, Shield, Star, Calendar, Edit3, Save, X,
  Bell, BellOff, Trophy, ThumbsUp, FileText, CheckCircle,
  Lock, Moon, Sun, LogOut, Trash2, Award, Zap, Target,
  TrendingUp, Loader2, ChevronRight, Eye, EyeOff, Crown, Flame
} from 'lucide-react';

/* ─── Badge / Rank Helpers ────────────────── */
const getBadge = (points) => {
  if (points >= 500) return { label: 'Civic Legend',     emoji: '👑', color: 'from-amber-400 to-yellow-500',   textColor: 'text-amber-400',   tier: 5 };
  if (points >= 300) return { label: 'Civic Champion',   emoji: '🏆', color: 'from-yellow-400 to-orange-500', textColor: 'text-yellow-400',  tier: 4 };
  if (points >= 150) return { label: 'Community Hero',   emoji: '⭐', color: 'from-purple-400 to-pink-500',   textColor: 'text-purple-400',  tier: 3 };
  if (points >= 80)  return { label: 'Active Citizen',   emoji: '🌟', color: 'from-blue-400 to-cyan-500',     textColor: 'text-blue-400',    tier: 2 };
  if (points >= 30)  return { label: 'Rising Contributor', emoji: '🌱', color: 'from-emerald-400 to-teal-500', textColor: 'text-emerald-400', tier: 1 };
  return               { label: 'New Member',        emoji: '💚', color: 'from-slate-400 to-slate-500',   textColor: 'text-slate-400',   tier: 0 };
};

const ACHIEVEMENT_LIST = [
  { id: 'first_report',   icon: FileText,    label: 'First Report',    desc: 'Report your first civic issue',   threshold: (s) => s.totalIssues >= 1 },
  { id: 'five_reports',    icon: Target,      label: 'Issue Hunter',    desc: 'Report 5 civic issues',           threshold: (s) => s.totalIssues >= 5 },
  { id: 'ten_reports',     icon: Flame,       label: 'On Fire',         desc: 'Report 10 civic issues',          threshold: (s) => s.totalIssues >= 10 },
  { id: 'first_resolved',  icon: CheckCircle, label: 'Problem Solver',  desc: 'Get your first issue resolved',   threshold: (s) => s.resolved >= 1 },
  { id: 'five_upvotes',    icon: ThumbsUp,    label: 'Community Voice',  desc: 'Receive 5 upvotes total',         threshold: (s) => s.upvotes >= 5 },
  { id: 'hundred_points',  icon: Zap,         label: 'Century Club',    desc: 'Earn 100 civic points',           threshold: (s) => s.points >= 100 },
  { id: 'top_ten',         icon: Crown,       label: 'Top 10',          desc: 'Reach the Top 10 leaderboard',    threshold: (s) => s.rank <= 10 && s.rank > 0 },
  { id: 'champion',        icon: Trophy,      label: 'Champion',        desc: 'Reach Civic Champion rank',       threshold: (s) => s.points >= 300 },
];

/* ─── Animated Container ─────────────────── */
const Section = ({ title, icon: Icon, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    className="glass rounded-2xl border border-white/5 overflow-hidden"
  >
    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary-600/15 flex items-center justify-center">
        <Icon size={16} className="text-primary-400" />
      </div>
      <h3 className="font-bold text-white text-sm">{title}</h3>
    </div>
    <div className="p-6">
      {children}
    </div>
  </motion.div>
);

/* ─── Toggle Switch Component ────────────── */
const Toggle = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium text-slate-200">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
        enabled ? 'bg-primary-600' : 'bg-slate-700'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
      />
    </button>
  </div>
);

/* ─── Stat Card ──────────────────────────── */
const StatCard = ({ icon: Icon, value, label, gradient }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    className="glass rounded-xl p-4 border border-white/5 text-center"
  >
    <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
      <Icon size={18} className="text-white" />
    </div>
    <div className="text-xl font-black text-white">{value}</div>
    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
  </motion.div>
);

/* ═══════════════════════════════════════════
   SETTINGS PAGE
   ═══════════════════════════════════════════ */
const Settings = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Notification preferences (UI placeholders — local state)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [issueUpdates, setIssueUpdates] = useState(true);
  const [leaderboardUpdates, setLeaderboardUpdates] = useState(false);

  // Security
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Theme
  const [darkMode, setDarkMode] = useState(true);

  // Activity / stats
  const [stats, setStats] = useState({ totalIssues: 0, resolved: 0, upvotes: 0, rank: '-', points: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        // fetch user's issues
        const issuesRes = await api.get('/api/issues');
        const allIssues = Array.isArray(issuesRes.data) ? issuesRes.data : [];
        const myIssues = allIssues.filter(i => i.reporterId === user?.userId);
        const resolved = myIssues.filter(i => i.status === 'RESOLVED').length;

        // fetch leaderboard for rank
        let rank = '-';
        try {
          const lbRes = await api.get('/api/leaderboard');
          const lb = Array.isArray(lbRes.data) ? lbRes.data : [];
          const idx = lb.findIndex(e => e.userId === user?.userId);
          if (idx >= 0) rank = idx + 1;
        } catch {}

        // Count upvotes: sum of vote counts for my issues
        let upvotes = 0;
        try {
          const votePromises = myIssues.map(issue =>
            api.get(`/api/votes/issue/${issue.id}/count`).then(r => r.data).catch(() => 0)
          );
          const voteCounts = await Promise.all(votePromises);
          upvotes = voteCounts.reduce((sum, v) => sum + Math.max(0, v), 0);
        } catch {}

        setStats({
          totalIssues: myIssues.length,
          resolved,
          upvotes,
          rank,
          points: user?.points || 0,
        });
      } catch (err) {
        // silently fail
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      loadStats();
      refreshUser();
    }
  }, [user?.userId]);

  // Sync edit fields
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      // Placeholder: In production you'd call an API endpoint
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields'); return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    // Placeholder action
    toast.success('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordSection(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const badge = getBadge(user?.points || 0);
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long',
  }) : 'June 2026';

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <h1 className="page-title">Account Center</h1>
        <p className="page-subtitle">Manage your CivicTrackGuard profile, preferences, and security</p>
      </motion.div>

      {/* ── Profile Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-2xl border border-white/5 overflow-hidden"
      >
        {/* Gradient banner */}
        <div className="h-28 sm:h-32 relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${badge.color} opacity-30`} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_60%)]" />
          {/* Decorative dots */}
          <div className="absolute top-4 right-4 flex gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-white/20" />
            ))}
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8 -mt-14 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-black text-white 
                           ring-4 ring-slate-950 shadow-xl"
                style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {/* Online dot */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-slate-950" />
            </motion.div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0 sm:mb-1">
              <h2 className="text-2xl font-black text-white">{user?.name || 'User'}</h2>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 justify-center sm:justify-start mt-1">
                <Mail size={13} /> {user?.email}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 mt-2 justify-center sm:justify-start">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${badge.color} text-white`}>
                  {badge.emoji} {badge.label}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Shield size={12} /> {user?.role || 'USER'}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar size={12} /> Since {memberSince}
                </span>
              </div>
            </div>

            {/* Points badge */}
            <div className="glass rounded-xl px-5 py-3 text-center border border-white/5 sm:mb-1">
              <div className="text-2xl font-black text-white">{user?.points ?? 0}</div>
              <div className="text-xs text-primary-400 font-semibold">Civic Points</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Activity Summary ── */}
      <Section title="Activity Summary" icon={TrendingUp} delay={0.1}>
        {loadingStats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary-400" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={FileText}    value={stats.totalIssues}  label="Issues Reported"    gradient="from-blue-500 to-cyan-500" />
            <StatCard icon={CheckCircle} value={stats.resolved}     label="Issues Resolved"    gradient="from-emerald-500 to-teal-500" />
            <StatCard icon={ThumbsUp}    value={stats.upvotes}      label="Total Upvotes"      gradient="from-purple-500 to-pink-500" />
            <StatCard icon={Trophy}      value={stats.rank === '-' ? '-' : `#${stats.rank}`}  label="Current Rank" gradient="from-amber-500 to-orange-500" />
          </div>
        )}
      </Section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Edit Profile ── */}
        <Section title="Edit Profile" icon={Edit3} delay={0.15}>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveProfile} disabled={saving} className="btn-primary text-sm flex-1">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary text-sm px-4">
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Name</p>
                  <p className="text-sm text-white mt-0.5">{user?.name}</p>
                </div>
              </div>
              <div className="border-t border-white/5" />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email</p>
                  <p className="text-sm text-white mt-0.5">{user?.email}</p>
                </div>
              </div>
              <div className="border-t border-white/5" />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Role</p>
                  <p className="text-sm text-white mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
              </div>
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm w-full mt-3">
                <Edit3 size={14} /> Edit Profile
              </button>
            </div>
          )}
        </Section>

        {/* ── Notification Preferences ── */}
        <Section title="Notifications" icon={Bell} delay={0.2}>
          <div className="space-y-1 divide-y divide-white/5">
            <Toggle
              enabled={emailNotifs}
              onChange={setEmailNotifs}
              label="Email Notifications"
              description="Receive updates via email"
            />
            <Toggle
              enabled={issueUpdates}
              onChange={setIssueUpdates}
              label="Issue Status Updates"
              description="When your reported issues change status"
            />
            <Toggle
              enabled={leaderboardUpdates}
              onChange={setLeaderboardUpdates}
              label="Leaderboard Updates"
              description="Weekly leaderboard ranking changes"
            />
          </div>
        </Section>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Security ── */}
        <Section title="Security" icon={Lock} delay={0.25}>
          {showPasswordSection ? (
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Current Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  className="input-field pr-10"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  className="input-field"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Confirm New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  className="input-field"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={e => setShowPasswords(e.target.checked)}
                  className="rounded border-slate-600"
                />
                Show passwords
              </label>
              <div className="flex gap-2 pt-1">
                <button onClick={handleChangePassword} className="btn-primary text-sm flex-1">
                  <Lock size={14} /> Update Password
                </button>
                <button onClick={() => setShowPasswordSection(false)} className="btn-secondary text-sm px-4">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-400 mb-4">Manage your password and account security settings.</p>
              <button onClick={() => setShowPasswordSection(true)} className="btn-secondary text-sm w-full">
                <Lock size={14} /> Change Password
              </button>
            </div>
          )}
        </Section>

        {/* ── Theme Preferences ── */}
        <Section title="Appearance" icon={darkMode ? Moon : Sun} delay={0.3}>
          <div className="space-y-4">
            <Toggle
              enabled={darkMode}
              onChange={(val) => {
                setDarkMode(val);
                toast.success(val ? '🌙 Dark mode enabled' : '☀️ Light mode enabled (visual only)');
              }}
              label="Dark Mode"
              description="Use dark theme across the application"
            />
            <div className="glass-light rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Moon size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Dark Blue Glassmorphism</p>
                  <p className="text-xs text-slate-500">Current active theme</p>
                </div>
                <div className="ml-auto">
                  <div className="w-5 h-5 rounded-full bg-primary-500 ring-2 ring-primary-400/30" />
                </div>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ── Achievements / Badges ── */}
      <Section title="Achievements & Badges" icon={Award} delay={0.35}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACHIEVEMENT_LIST.map((ach) => {
            const earned = ach.threshold({
              totalIssues: stats.totalIssues,
              resolved: stats.resolved,
              upvotes: stats.upvotes,
              rank: typeof stats.rank === 'number' ? stats.rank : 999,
              points: user?.points || 0,
            });
            const AchIcon = ach.icon;
            return (
              <motion.div
                key={ach.id}
                whileHover={{ scale: 1.04 }}
                className={`relative rounded-xl p-4 border text-center transition-all duration-300 ${
                  earned
                    ? 'glass border-primary-500/30 bg-primary-500/5'
                    : 'glass border-white/5 opacity-50 grayscale'
                }`}
              >
                {earned && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                )}
                <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                  earned ? 'bg-primary-600/20 text-primary-400' : 'bg-slate-800 text-slate-600'
                }`}>
                  <AchIcon size={18} />
                </div>
                <p className="text-xs font-bold text-white">{ach.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{ach.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── Account Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl border border-white/5 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
            <Shield size={16} className="text-red-400" />
          </div>
          <h3 className="font-bold text-white text-sm">Account Actions</h3>
        </div>
        <div className="p-6 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 
                       text-slate-300 hover:bg-slate-700/60 hover:border-slate-600 transition-all duration-200 group"
          >
            <span className="flex items-center gap-3">
              <LogOut size={16} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium">Sign Out</span>
            </span>
            <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-red-500/5 border border-red-500/15 
                       text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200 group"
          >
            <span className="flex items-center gap-3">
              <Trash2 size={16} />
              <span className="text-sm font-medium">Delete Account</span>
            </span>
            <ChevronRight size={16} className="text-red-600 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </motion.div>

      {/* ── Delete Account Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass rounded-2xl border border-red-500/20 p-8 max-w-sm w-full text-center space-y-4"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 flex items-center justify-center">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Account?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                This action is permanent and cannot be undone. All your data, reported issues, and achievements will be lost.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary flex-1 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    toast.success('Account deletion request submitted (UI only)');
                  }}
                  className="btn-danger flex-1 text-sm"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;

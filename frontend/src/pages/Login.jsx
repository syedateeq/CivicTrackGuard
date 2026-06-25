import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Shield, ShieldCheck, AlertCircle, Loader2, Eye, EyeOff, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/helpers';

// ── Demo credentials – only rendered in development mode ──────────────────
const IS_DEV = import.meta.env.DEV;

const DEMO_CREDS = [
  {
    role: 'Citizen Account',
    icon: '👤',
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    badge: 'text-blue-400 bg-blue-500/10',
    email: 'test@example.com',
    password: 'test123',
  },
  {
    role: 'Admin Account',
    icon: '🛡️',
    color: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30',
    badge: 'text-purple-400 bg-purple-500/10',
    email: 'admin@civictrack.com',
    password: 'admin',
  },
];

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy"
      className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-all duration-150 shrink-0"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
};

const CredRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-slate-900/60 border border-white/5">
    <span className="text-xs text-slate-500 w-16 shrink-0">{label}</span>
    <span className="text-xs text-slate-200 font-mono truncate flex-1">{value}</span>
    <CopyButton text={value} />
  </div>
);

const DemoCredentials = ({ onFill }) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="mt-6"
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl
                   bg-gradient-to-r from-slate-800/80 to-slate-800/40
                   border border-white/8 hover:border-white/15
                   text-xs text-slate-400 hover:text-slate-200
                   transition-all duration-200 group"
      >
        <span className="flex items-center gap-2">
          <span className="text-base">🔑</span>
          <span className="font-semibold tracking-wide">Demo Credentials</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            dev
          </span>
        </span>
        {open ? <ChevronUp size={14} className="transition-transform" /> : <ChevronDown size={14} className="transition-transform" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="creds"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_CREDS.map(({ role, icon, color, border, badge, email, password }) => (
                <div
                  key={role}
                  className={`rounded-xl p-3.5 bg-gradient-to-br ${color} border ${border} space-y-2`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge}`}>
                      {icon} {role}
                    </span>
                    <button
                      type="button"
                      onClick={() => onFill(email, password)}
                      className="text-[10px] font-semibold text-slate-400 hover:text-white
                                 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-150 border border-white/5"
                    >
                      Auto-fill
                    </button>
                  </div>
                  <CredRow label="Email" value={email} />
                  <CredRow label="Password" value={password} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main Login Component ───────────────────────────────────────────────────
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Welcome back!');
      if (data.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = (e, p) => {
    setEmail(e);
    setPassword(p);
    toast('Credentials filled – press Sign In!', { icon: '✏️', duration: 2500 });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              <Shield size={20} className="text-white" />
            </div>
            <span className="font-bold text-white text-xl">CivicTrackGuard</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm">Sign in to your account to continue</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/8">
          {error && (
            <div className="flex items-start gap-3 mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email" required autoComplete="email"
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Primary Sign In button */}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 rounded-xl flex items-center justify-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
            </button>

            {/* Admin Login button – placed directly below Sign In */}
            <Link
              to="/admin/login"
              className="group w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                         border border-purple-500/40 bg-purple-500/5
                         text-purple-300 text-sm font-semibold
                         hover:border-purple-400/70 hover:bg-purple-500/15 hover:text-purple-200
                         transition-all duration-200
                         shadow-[0_0_0_0_rgba(168,85,247,0)] hover:shadow-[0_0_14px_2px_rgba(168,85,247,0.25)]"
            >
              <ShieldCheck
                size={16}
                className="text-purple-400 group-hover:scale-110 transition-transform duration-200"
              />
              Admin Login
            </Link>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Create one
            </Link>
          </p>

          {/* Demo credentials – only in development */}
          {IS_DEV && <DemoCredentials onFill={handleAutoFill} />}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ShieldCheck, AlertCircle, Loader2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/helpers';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.role !== 'ADMIN') {
        logout();
        throw new Error('Only admin accounts can access this portal. Use the demo admin credentials below for hackathon judging.');
      }
      toast.success('Welcome back, Admin!');
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async () => {
    setEmail('admin@civictrack.com');
    setPassword('admin');
    setError('');
    setLoading(true);
    try {
      const data = await login('admin@civictrack.com', 'admin');
      if (data.role !== 'ADMIN') {
        logout();
        throw new Error('Only admin accounts can access this portal. Use the demo admin credentials below for hackathon judging.');
      }
      toast.success('Welcome back, Admin!');
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('admin@civictrack.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText('admin');
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-white text-xl">CivicTrackGuard Admin</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-1">Admin Portal</h1>
          <p className="text-slate-500 text-sm">Sign in to manage civic issues</p>
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Admin Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email" required autoComplete="email"
                  className="input-field pl-10"
                  placeholder="admin@example.com"
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

            <button type="submit" disabled={loading} className="w-full py-3 mt-2 rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enter Admin Portal'}
            </button>
          </form>
          
          {/* Demo Admin Credentials Card */}
          <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-indigo-300">Demo Admin / Judges</h3>
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                <span className="text-sm text-slate-300 font-mono tracking-wide">admin@civictrack.com</span>
                <button type="button" onClick={handleCopyEmail} className="p-1 rounded-md text-slate-500 hover:bg-slate-800 hover:text-indigo-400 transition-colors" title="Copy Email">
                  {copiedEmail ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="flex items-center justify-between bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                <span className="text-sm text-slate-300 font-mono tracking-widest">admin</span>
                <button type="button" onClick={handleCopyPassword} className="p-1 rounded-md text-slate-500 hover:bg-slate-800 hover:text-indigo-400 transition-colors" title="Copy Password">
                  {copiedPassword ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <button 
              type="button" 
              onClick={loginAsDemo}
              disabled={loading}
              className="w-full py-2.5 mt-1 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all flex items-center justify-center gap-2 border border-indigo-500/50 shadow-lg shadow-indigo-500/20"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Login as Demo Admin'}
            </button>
          </div>
          
          <p className="text-center text-sm text-slate-500 mt-6">
            <Link to="/login" className="text-slate-400 hover:text-white font-medium transition-colors">
              Return to Citizen Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

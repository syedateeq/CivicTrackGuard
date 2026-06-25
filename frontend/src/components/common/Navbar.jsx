import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Shield, Bell, Menu, X, User, LogOut, LayoutDashboard, 
  FileText, PlusCircle, Trophy, Settings, ShieldCheck, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Issues', path: '/issues', icon: FileText },
    ...(isAdmin ? [] : [{ name: 'Report', path: '/issues/new', icon: PlusCircle }]),
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 inset-x-0 h-16 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight hidden sm:block">
              Civic<span className="text-primary-400">Track</span>Guard
            </span>
          </Link>

          {/* Desktop Nav Links */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map(({ name, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={15} />
                  {name}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <ShieldCheck size={15} />
                  Admin
                </NavLink>
              )}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link to="/notifications"
                  className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-950" />
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary-600/30 flex items-center justify-center text-primary-400 font-bold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-300 hidden sm:block max-w-24 truncate">
                      {user?.name?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDown size={14} className={cn("text-slate-500 transition-transform duration-200", dropdownOpen && "rotate-180")} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 glass rounded-xl border border-white/8 shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs font-bold text-primary-400">{user?.points || 0}</span>
                          <span className="text-xs text-slate-500">points</span>
                          {isAdmin && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-400 font-bold">ADMIN</span>}
                        </div>
                      </div>
                      <Link to="/profile" 
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                        onClick={() => setDropdownOpen(false)}>
                        <User size={15} /> Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm text-slate-400 hover:text-white px-3 py-2 transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2 text-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && isAuthenticated && (
        <div className="lg:hidden fixed inset-x-0 top-16 z-40 glass border-b border-white/5 py-3 px-4">
          {navItems.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors mb-1',
                isActive ? 'bg-primary-600/20 text-primary-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} /> {name}
            </NavLink>
          ))}
        </div>
      )}

      {/* Overlay for dropdown */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
      )}
    </>
  );
};

export default Navbar;

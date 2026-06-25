import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, PlusCircle, Trophy, Bell, 
  ShieldCheck, Settings, Map, PhoneCall
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const Sidebar = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;

  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { name: 'Dashboard',    path: '/dashboard',    icon: LayoutDashboard },
    { name: 'Issue Feed',   path: '/issues',       icon: FileText },
    ...(isAdmin ? [] : [{ name: 'Report Issue', path: '/issues/new',   icon: PlusCircle }]),
    { name: 'Map',           path: '/map',          icon: Map },
    { name: 'Leaderboard',   path: '/leaderboard',  icon: Trophy },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Emergency',     path: '/emergency',    icon: PhoneCall },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: ShieldCheck });
  }

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 hidden lg:flex flex-col z-40 glass-light border-r border-white/5">
      <div className="flex-1 py-6 px-3 overflow-y-auto space-y-0.5">
        {navItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
              isActive
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            )}
          >
            <Icon size={17} className="transition-transform duration-200 group-hover:scale-110 shrink-0" />
            <span>{name}</span>
          </NavLink>
        ))}
      </div>

      {/* Bottom user info */}
      <div className="p-3 border-t border-white/5">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent',
            isActive ? 'bg-primary-600/20 text-primary-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          )}
        >
          <Settings size={17} className="shrink-0" /> Settings
        </NavLink>
        <div className="mt-3 px-3 py-3 glass rounded-xl">
          <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500">{user?.role}</span>
            <span className="text-xs font-bold text-primary-400">{user?.points ?? 0} pts</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

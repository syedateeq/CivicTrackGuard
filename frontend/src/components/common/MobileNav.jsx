import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Map, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const MobileNav = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;

  const isAdmin = user?.role === 'ADMIN';

  // Primary navigation items for the bottom bar
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Issues', path: '/issues', icon: FileText },
    ...(isAdmin ? [] : [{ name: 'Report', path: '/issues/new', icon: PlusCircle, isPrimary: true }]),
    { name: 'Map', path: '/map', icon: Map },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 sm:h-18 z-50 glass border-t border-white/5 lg:hidden pb-safe">
      <div className="flex items-center justify-around h-full px-2 max-w-md mx-auto">
        {navItems.map(({ name, path, icon: Icon, isPrimary }) => {
          if (isPrimary) {
            return (
              <NavLink
                key={path}
                to={path}
                className="relative -top-4 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 border-4 border-slate-950 transition-transform active:scale-95"
              >
                <Icon size={24} />
              </NavLink>
            );
          }

          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => cn(
                'flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors pt-1',
                isActive ? 'text-primary-400' : 'text-slate-400 hover:text-slate-300'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;

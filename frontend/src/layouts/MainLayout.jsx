import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import MobileNav from '../components/common/MobileNav';
import InstallPrompt from '../components/common/InstallPrompt';
import ChatbotWidget from '../components/common/ChatbotWidget';
import { useAuth } from '../context/AuthContext';

// Routes that have no sidebar (public pages)
const NO_SIDEBAR_ROUTES = ['/', '/login', '/register'];

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const showSidebar = isAuthenticated && !NO_SIDEBAR_ROUTES.includes(location.pathname);

  useEffect(() => {
    const handleOffline = () => {
      toast('You are offline. Some features may be unavailable.', {
        icon: '📡',
        duration: 5000,
        style: {
          background: '#334155',
          color: '#fff',
        },
      });
    };
    
    const handleOnline = () => {
      toast.success('You are back online!');
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />

      <Navbar />

      <div className="flex pt-16 min-h-screen">
        {showSidebar && <Sidebar />}

        {/* pb-20 added for mobile nav spacing */}
        <main className={`flex-1 min-w-0 transition-all duration-300 pb-20 lg:pb-0 ${showSidebar ? 'lg:ml-60' : ''}`}>
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <InstallPrompt />
      {showSidebar && <MobileNav />}

      {/* CivicBot — floating chatbot widget (authenticated users only) */}
      {isAuthenticated && <ChatbotWidget />}
    </div>
  );
};

export default MainLayout;

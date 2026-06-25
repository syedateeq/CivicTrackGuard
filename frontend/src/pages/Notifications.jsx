import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle2, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return;
      try {
        const res = await api.get(`/api/notifications/user/${user.userId}`);
        setNotifications(Array.isArray(res.data) ? res.data.reverse() : []);
      } catch (err) {
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.userId]);

  const markAsSeen = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/seen`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const markAllSeen = async () => {
    const unread = notifications.filter(n => !n.seen);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => api.put(`/api/notifications/${n.id}/seen`)));
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.seen).length;

  return (
    <div className="max-w-3xl mx-auto pb-10 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Bell className="text-primary-400" size={28} />
            Notifications
          </h1>
          <p className="page-subtitle">You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllSeen} className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
            <CheckCircle2 size={16} /> Mark all as read
          </button>
        )}
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary-500 w-10 h-10" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Bell size={40} className="mx-auto mb-4 text-slate-600" />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-5 flex gap-4 transition-colors ${n.seen ? 'hover:bg-white/3' : 'bg-primary-500/10 hover:bg-primary-500/15'}`}
              >
                <div className="mt-1">
                  {!n.seen ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  ) : (
                    <CheckCircle size={16} className="text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${!n.seen ? 'text-white font-medium' : 'text-slate-300'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.seen && (
                  <button onClick={() => markAsSeen(n.id)} className="text-xs text-primary-400 hover:text-white shrink-0 self-center">
                    Mark Read
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

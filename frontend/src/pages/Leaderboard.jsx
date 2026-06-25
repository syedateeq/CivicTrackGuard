import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Trophy, Medal, Award, Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const res = await api.get('/api/leaderboard');
        setLeaders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (showLoading) setLoading(false);
      }
    };
    load(true);
    const interval = setInterval(() => load(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy size={24} className="text-yellow-400" />;
      case 2: return <Medal size={24} className="text-slate-300" />;
      case 3: return <Medal size={24} className="text-amber-600" />;
      default: return <span className="font-bold text-slate-500">#{rank}</span>;
    }
  };

  const getRankBg = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-500/10 border-yellow-500/30';
      case 2: return 'bg-slate-300/10 border-slate-300/30';
      case 3: return 'bg-amber-600/10 border-amber-600/30';
      default: return 'glass border-white/5';
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      <div className="page-header text-center">
        <h1 className="page-title flex items-center justify-center gap-3">
          <Trophy className="text-yellow-400" size={32} />
          Community Leaderboard
        </h1>
        <p className="page-subtitle max-w-lg mx-auto mt-2">
          Recognizing the top citizens making a real difference in the community through active reporting and engagement.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary-500 w-12 h-12" />
        </div>
      ) : leaders.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-white/5">
          <Award size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 font-medium">No leaders yet.</p>
          <p className="text-slate-600 text-sm mt-1">Start reporting issues to earn points!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-6 border ${getRankBg(leader.rank)}`}
            >
              <div className="w-12 text-center shrink-0 flex items-center justify-center">
                {getRankIcon(leader.rank)}
              </div>
              
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shrink-0"
                   style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                {leader.name?.charAt(0)?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{leader.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star size={12} className={leader.rank <= 3 ? 'text-yellow-400' : 'text-slate-400'} />
                  <span className="text-xs font-semibold text-slate-400">{leader.badge}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-white">{leader.points}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">pts</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

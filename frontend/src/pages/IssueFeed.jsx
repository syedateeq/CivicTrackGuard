import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Search, Filter, ChevronLeft, ChevronRight, Loader2,
  MapPin, ThumbsUp, ThumbsDown, MessageCircle, Clock, X, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatusBadgeClass, getSeverityBadgeClass, timeAgo, truncate } from '../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES = ['ALL', 'ROAD_DAMAGE', 'GARBAGE', 'WATER_LEAKAGE', 'STREETLIGHT', 'ELECTRICITY', 'OTHER'];
const STATUSES   = ['ALL', 'PENDING', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

/* ─────────────────────────────────────────────
   Issue Card — fully clickable
   ───────────────────────────────────────────── */
const IssueCard = ({ issue }) => {
  const navigate = useNavigate();

  // Guard: only navigate if issue has a valid id
  const handleCardClick = () => {
    if (issue?.id == null) return;
    navigate(`/issues/${issue.id}`);
  };

  const severityGradient =
    issue.severity === 'HIGH'   ? '#ef4444' :
    issue.severity === 'MEDIUM' ? '#f59e0b' : '#10b981';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-white/15
                 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300
                 flex flex-col cursor-pointer group"
    >
      {/* Image or severity accent */}
      {issue.imageUrl ? (
        <div className="h-40 overflow-hidden shrink-0 relative">
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/80 to-transparent" />
        </div>
      ) : (
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${severityGradient}, transparent)` }}
        />
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={getStatusBadgeClass(issue.status)}>
            {issue.status?.replace('_', ' ')}
          </span>
          <span className={getSeverityBadgeClass(issue.severity)}>
            {issue.severity}
          </span>
          {issue.category && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 tracking-wide">
              {issue.category.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
          {issue.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {truncate(issue.description, 100)}
        </p>

        {/* Location */}
        {(issue.address || issue.location) && (
          <p className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
            <MapPin size={11} className="shrink-0" />
            {issue.address || issue.location}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1 text-emerald-600">
              <ThumbsUp size={11} /> {issue.upvoteCount ?? issue.voteCount ?? 0}
            </span>
            {(issue.downvoteCount ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <ThumbsDown size={11} /> {issue.downvoteCount}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageCircle size={11} /> {issue.commentCount ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Clock size={11} /> {timeAgo(issue.createdAt)}
            </span>
            <ArrowRight size={13} className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   Issue Feed Page
   ───────────────────────────────────────────── */
const IssueFeed = () => {
  const [issues, setIssues]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory]       = useState('ALL');
  const [status, setStatus]           = useState('ALL');

  const fetchIssues = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      let res;
      if (search.trim()) {
        res = await api.get(`/api/issues/search?keyword=${encodeURIComponent(search)}&page=${page}&size=9`);
      } else if (category !== 'ALL') {
        res = await api.get(`/api/issues/category/${category}`);
        const data = Array.isArray(res.data) ? res.data.filter(i => i.status !== 'REJECTED') : [];
        const filtered = status !== 'ALL' ? data.filter(i => i.status === status) : data;
        setIssues(filtered);
        setTotalPages(1);
        return;
      } else {
        res = await api.get(`/api/issues/page?page=${page}&size=9`);
      }

      const d = res.data;
      if (d?.content) {
        let content = d.content.filter(i => i.status !== 'REJECTED');
        if (status !== 'ALL') content = content.filter(i => i.status === status);
        setIssues(content);
        setTotalPages(d.totalPages || 1);
      } else if (Array.isArray(d)) {
        const data = d.filter(i => i.status !== 'REJECTED');
        const filtered = status !== 'ALL' ? data.filter(i => i.status === status) : data;
        setIssues(filtered);
        setTotalPages(1);
      }
    } catch (err) {
      toast.error('Failed to load issues');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [page, search, category, status]);

  useEffect(() => { 
    fetchIssues(true); 
    const interval = setInterval(() => {
      fetchIssues(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchIssues]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(0);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Issue Feed</h1>
          <p className="page-subtitle">All civic issues reported in your community</p>
        </div>
        <Link to="/issues/new" className="btn-primary text-sm px-4 py-2.5 shrink-0">
          + Report Issue
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="glass rounded-2xl p-4 border border-white/5 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search issues by title, description, location..."
              className="input-field pl-10 pr-10 py-2.5"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary text-sm px-4">Search</button>
        </form>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <span className="text-xs text-slate-500 font-medium">Category:</span>
          </div>
          {CATEGORIES.map(c => (
            <button key={c}
              onClick={() => { setCategory(c); setPage(0); }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                category === c
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}>
              {c.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
          </div>
          {STATUSES.map(s => (
            <button key={s}
              onClick={() => { setStatus(s); setPage(0); }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                status === s
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Issue Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary-500 w-10 h-10" />
        </div>
      ) : issues.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-white/5">
          <Search size={40} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-lg font-medium">No issues found</p>
          <p className="text-slate-600 text-sm mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${page}-${category}-${status}-${search}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="btn-secondary py-2 px-4 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-400">
            Page <span className="text-white font-semibold">{page + 1}</span> of {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="btn-secondary py-2 px-4 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default IssueFeed;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
  ThumbsUp, ThumbsDown, MessageCircle, MapPin, Calendar, User,
  Loader2, AlertCircle, BrainCircuit, CheckCircle, Shield,
  ZoomIn, X, Maximize2, Image as ImageIcon, Info, Navigation,
  ExternalLink, Globe, Tag, Building2, Hash, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  getStatusBadgeClass, getSeverityBadgeClass, formatDate, getErrorMessage
} from '../utils/helpers';

/* ───────────────────────────────────────────
   Image Lightbox Modal
   ─────────────────────────────────────────── */
const ImageLightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[110] w-10 h-10 rounded-full bg-white/10 border border-white/20
                     flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
          <X size={20} />
        </button>
        <motion.img
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          className="max-w-[95vw] max-h-[92vh] object-contain rounded-xl shadow-2xl cursor-default select-none"
          draggable={false}
        />
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-lg border border-white/10
                     rounded-xl px-5 py-2.5 text-sm text-slate-300 max-w-xl truncate"
        >
          {alt}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ───────────────────────────────────────────
   Image Preview Section
   ─────────────────────────────────────────── */
const ImagePreview = ({ imageUrl, title }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgMeta, setImgMeta] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    setImgMeta({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setImgLoaded(true);
  }, []);

  if (imgError) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl overflow-hidden border border-white/5"
      >
        <div className="px-6 py-3.5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <ImageIcon size={15} className="text-primary-400" />
            Issue Photo
          </h3>
          {imgMeta && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Info size={11} /> {imgMeta.width} × {imgMeta.height}px
            </span>
          )}
        </div>

        <div className="relative group">
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 min-h-[200px]">
              <Loader2 className="animate-spin text-primary-400" size={24} />
            </div>
          )}

          <div className="bg-slate-950/50 flex items-center justify-center p-4 min-h-[220px] sm:min-h-[340px]">
            <img
              src={imageUrl}
              alt={title}
              onLoad={handleImageLoad}
              onError={() => setImgError(true)}
              className={`max-w-full max-h-[480px] w-auto h-auto object-contain rounded-lg
                transition-all duration-500 select-none
                ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              draggable={false}
            />
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30
                       transition-all duration-300 cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          >
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300
                         bg-white/15 backdrop-blur-md border border-white/25 rounded-xl px-4 py-2.5
                         flex items-center gap-2 text-white text-sm font-medium">
              <Maximize2 size={15} /> View Full Size
            </div>
          </div>
        </div>

        {imgMeta && (
          <div className="px-6 py-2.5 border-t border-white/5 flex justify-end">
            <button
              onClick={() => setLightboxOpen(true)}
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              <ZoomIn size={12} /> Click to zoom
            </button>
          </div>
        )}
      </motion.div>

      {lightboxOpen && (
        <ImageLightbox src={imageUrl} alt={title} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
};

/* ───────────────────────────────────────────
   Location Section — embedded map + GMaps link
   ─────────────────────────────────────────── */
const LocationSection = ({ latitude, longitude, address }) => {
  const hasCoords = latitude != null && longitude != null;
  if (!hasCoords && !address) return null;

  // Use OpenStreetMap embed (no API key required)
  const osmEmbedUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`
    : null;

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(address)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-2xl overflow-hidden border border-white/5"
    >
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm">
          <MapPin size={15} className="text-primary-400" /> Location Details
        </h3>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={12} /> Open in Google Maps
        </a>
      </div>

      {/* Map embed */}
      {osmEmbedUrl && (
        <div className="relative w-full h-52 sm:h-64 bg-slate-900">
          <iframe
            src={osmEmbedUrl}
            title="Issue location map"
            className="w-full h-full border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
          {/* Dark overlay to match theme */}
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
        </div>
      )}

      {/* Location details */}
      <div className="p-5 grid sm:grid-cols-2 gap-4">
        {address && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Globe size={11} /> Address
            </p>
            <p className="text-sm text-slate-200">{address}</p>
          </div>
        )}
        {hasCoords && (
          <>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Latitude</p>
              <p className="text-sm text-slate-200 font-mono">{latitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Longitude</p>
              <p className="text-sm text-slate-200 font-mono">{longitude.toFixed(6)}</p>
            </div>
          </>
        )}
      </div>

      {/* Open in Google Maps button */}
      <div className="px-5 pb-5">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full text-sm justify-center gap-2"
        >
          <Navigation size={14} className="text-primary-400" />
          Open in Google Maps
        </a>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════
   ISSUE DETAILS PAGE
   ═══════════════════════════════════════════ */
const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [issue, setIssue]                   = useState(null);
  const [comments, setComments]             = useState([]);
  const [upvotes, setUpvotes]               = useState(0);
  const [downvotes, setDownvotes]           = useState(0);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [commentText, setCommentText]       = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [voting, setVoting]                 = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus]           = useState('');

  // Guard: id must be a valid number
  const numericId = id && !isNaN(Number(id)) ? Number(id) : null;

  useEffect(() => {
    if (!numericId) {
      setError('Invalid issue ID.');
      setLoading(false);
      return;
    }

    const load = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const [issueRes, commentsRes] = await Promise.all([
          api.get(`/issues/${numericId}`),
          api.get(`/comments/issue/${numericId}`),
        ]);

        const issueData = issueRes.data;
        setIssue(issueData);
        setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
        setNewStatus(issueData.status || 'PENDING');

        // Prefer separate counts from the enriched response
        if (issueData.upvoteCount != null) {
          setUpvotes(issueData.upvoteCount);
          setDownvotes(issueData.downvoteCount ?? 0);
        } else {
          // Fallback: fetch net count and treat as upvotes
          try {
            const voteRes = await api.get(`/votes/issue/${numericId}/count`);
            const net = voteRes.data ?? 0;
            setUpvotes(Math.max(0, net));
            setDownvotes(net < 0 ? Math.abs(net) : 0);
          } catch { /* non-critical */ }
        }
      } catch (err) {
        if (showLoading) {
          setError(getErrorMessage(err) || 'Failed to load issue details');
          toast.error('Failed to load issue details');
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    load(true);
    const interval = setInterval(() => load(false), 10000);
    return () => clearInterval(interval);
  }, [numericId]);

  const refreshVoteCounts = async () => {
    if (!numericId) return;
    try {
      const res = await api.get(`/issues/${numericId}`);
      setUpvotes(res.data.upvoteCount ?? 0);
      setDownvotes(res.data.downvoteCount ?? 0);
    } catch { /* non-critical */ }
  };

  const handleVote = async (voteType) => {
    if (!user) { toast.error('Please log in to vote'); return; }
    if (!numericId) return;
    setVoting(true);
    try {
      await api.post('/votes', { issueId: numericId, voteType });
      await refreshVoteCounts();
      toast.success(voteType === 'UPVOTE' ? '👍 Upvoted!' : '👎 Downvoted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setVoting(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) { toast.error('Please log in to comment'); return; }
    if (!numericId) return;
    setSubmittingComment(true);
    try {
      const res = await api.post('/comments', {
        text: commentText.trim(),
        issueId: numericId,
      });
      setComments(prev => [res.data, ...prev]);
      setCommentText('');
      toast.success('Comment added!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === issue?.status) return;
    if (!numericId) return;
    setStatusUpdating(true);
    try {
      const res = await api.put(`/issues/${numericId}/status`, { status: newStatus });
      setIssue(res.data);
      toast.success('Status updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStatusUpdating(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <Loader2 className="animate-spin text-primary-500 w-12 h-12" />
          <div className="absolute inset-0 animate-ping rounded-full bg-primary-500/20" />
        </div>
        <p className="text-slate-500 text-sm">Loading issue details…</p>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !issue) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <p className="text-slate-300 font-medium">{error || 'Issue not found'}</p>
        <Link to="/issues" className="btn-primary text-sm">← Back to Feed</Link>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-5">

      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={15} /> Back to Feed
        </button>
      </motion.div>

      {/* Image preview */}
      {issue.imageUrl ? (
        <ImagePreview imageUrl={issue.imageUrl} title={issue.title} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl overflow-hidden border border-white/5 flex flex-col items-center justify-center p-12 text-slate-500"
        >
          <ImageIcon size={32} className="mb-3 opacity-40 text-slate-400" />
          <p className="text-sm font-medium">No image uploaded</p>
        </motion.div>
      )}

      {/* ── Main Info Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-white/5 overflow-hidden"
      >
        <div className="p-6 sm:p-8 space-y-5">

          {/* Status / Severity / Category / Department badges */}
          <div className="flex flex-wrap gap-2">
            <span className={getStatusBadgeClass(issue.status)}>
              {issue.status?.replace(/_/g, ' ')}
            </span>
            <span className={getSeverityBadgeClass(issue.severity)}>
              {issue.severity}
            </span>
            {issue.category && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                <Tag size={10} /> {issue.category.replace(/_/g, ' ')}
              </span>
            )}
            {issue.department && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <Building2 size={10} /> {issue.department}
              </span>
            )}
          </div>

          {/* Issue ID + Title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <Hash size={11} /> Issue #{issue.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {issue.title}
            </h1>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            {(issue.reporterName || issue.userName) && (
              <span className="flex items-center gap-1.5">
                <User size={13} className="shrink-0" />
                {issue.reporterName || issue.userName}
              </span>
            )}
            {issue.createdAt && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="shrink-0" />
                {formatDate(issue.createdAt)}
              </span>
            )}
            {(issue.address || issue.location) && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="shrink-0" />
                {issue.address || issue.location}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {issue.description}
            </p>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="glass-light rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Status</p>
              <p className="text-sm text-white font-medium">{issue.status?.replace(/_/g, ' ')}</p>
            </div>
            <div className="glass-light rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Severity</p>
              <p className={`text-sm font-medium ${
                issue.severity === 'HIGH' ? 'text-red-400' :
                issue.severity === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
              }`}>{issue.severity}</p>
            </div>
            <div className="glass-light rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Category</p>
              <p className="text-sm text-white font-medium">{issue.category?.replace(/_/g, ' ') || '—'}</p>
            </div>
            <div className="glass-light rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Department</p>
              <p className="text-sm text-white font-medium truncate">{issue.department || '—'}</p>
            </div>
          </div>

          {/* AI Analysis */}
          {issue.aiSummary && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <BrainCircuit size={15} /> Gemini AI Analysis
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <span className="text-xs text-purple-600 font-semibold uppercase block mb-1">Summary</span>
                  <p className="text-slate-300">{issue.aiSummary}</p>
                </div>
                {issue.aiExplanation && (
                  <div className="col-span-2">
                    <span className="text-xs text-purple-600 font-semibold uppercase block mb-1">AI Reasoning</span>
                    <p className="text-slate-400 text-xs leading-relaxed">{issue.aiExplanation}</p>
                  </div>
                )}
                {issue.trustScore != null && (
                  <div className="col-span-2">
                    <span className="text-xs text-purple-600 font-semibold uppercase block mb-1">
                      Trust Score
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-purple-900/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full transition-all"
                          style={{ width: `${issue.trustScore}%` }}
                        />
                      </div>
                      <span className="text-purple-300 font-bold text-sm">{issue.trustScore}/100</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voting */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
            <button
              onClick={() => handleVote('UPVOTE')}
              disabled={voting}
              className="flex items-center gap-2 btn-secondary py-2 px-4 text-sm hover:border-emerald-500/30 hover:text-emerald-400"
            >
              <ThumbsUp size={15} />
              <span className="font-bold text-emerald-400">{upvotes}</span>
              Upvote
            </button>
            <button
              onClick={() => handleVote('DOWNVOTE')}
              disabled={voting}
              className="flex items-center gap-2 btn-secondary py-2 px-4 text-sm text-red-400 border-red-500/20 hover:bg-red-500/10"
            >
              <ThumbsDown size={15} />
              <span className="font-bold">{downvotes}</span>
              Downvote
            </button>
            <span className="text-sm text-slate-500 flex items-center gap-1.5 ml-1">
              <MessageCircle size={14} /> {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </span>
            {voting && <Loader2 size={14} className="animate-spin text-slate-500" />}
          </div>
        </div>
      </motion.div>

      {/* ── Location Section ── */}
      <LocationSection
        latitude={issue.latitude}
        longitude={issue.longitude}
        address={issue.address || issue.location}
      />

      {/* ── Admin Status Panel ── */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-6 border border-purple-500/20 bg-purple-500/5"
        >
          <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield size={14} /> Admin: Update Status
          </h3>
          <div className="flex gap-3">
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="input-field flex-1"
            >
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={statusUpdating || newStatus === issue.status}
              className="btn-primary px-6 disabled:opacity-50"
            >
              {statusUpdating
                ? <Loader2 size={16} className="animate-spin" />
                : <CheckCircle size={16} />}
              Update
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Comments Section ── */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="font-bold text-white flex items-center gap-2">
            <MessageCircle size={16} className="text-primary-400" />
            Comments ({comments.length})
          </h2>
        </div>

        {/* Add comment */}
        {user ? (
          <form onSubmit={handleComment} className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm shrink-0">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea
                  rows={3}
                  className="input-field resize-none text-sm"
                  placeholder="Add a comment…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  maxLength={500}
                />
                <div className="flex justify-between mt-2 items-center">
                  <span className="text-xs text-slate-600">{commentText.length}/500</span>
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
                  >
                    {submittingComment ? <Loader2 size={14} className="animate-spin" /> : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6 border-b border-white/5 text-center text-sm text-slate-500">
            <Link to="/login" className="text-primary-400 hover:underline">Log in</Link> to add a comment.
          </div>
        )}

        {/* Comment list */}
        <div className="divide-y divide-white/5">
          {comments.length > 0 ? (
            comments.map(c => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-5 flex gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">
                  {c.authorName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{c.authorName || 'Anonymous'}</span>
                    <span className="text-xs text-slate-600">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{c.text}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-600 text-sm">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueDetails;

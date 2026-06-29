import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, X, Eye, ThumbsUp, ArrowRight,
  MapPin, Clock, Sparkles, Loader2, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axiosConfig';
import { timeAgo } from '../utils/helpers';
import './DuplicateDetectionModal.css';

/**
 * DuplicateDetectionModal
 *
 * Shows potential duplicate issues found by AI before the user creates a new one.
 * Props:
 *   - duplicates: array of DuplicateCandidate objects from the API
 *   - onDismiss: callback when user decides to continue creating new issue
 *   - loading: boolean, true while the duplicate check is in progress
 *   - visible: boolean, controls visibility
 */
export default function DuplicateDetectionModal({ duplicates = [], onDismiss, loading, visible }) {
  const navigate = useNavigate();

  // Navigate to the existing issue's detail page
  const handleViewIssue = useCallback((issueId) => {
    navigate(`/issues/${issueId}`);
  }, [navigate]);

  // Upvote the existing issue and navigate to it
  const handleSupportIssue = useCallback(async (issueId) => {
    try {
      await api.post('/votes', {
        issueId: issueId,
        voteType: 'UPVOTE',
      });
      toast.success('You supported this issue! 👍');
      navigate(`/issues/${issueId}`);
    } catch (err) {
      // If vote fails (e.g., already voted), still navigate
      toast.error('Could not vote — you may have already supported this issue');
      navigate(`/issues/${issueId}`);
    }
  }, [navigate]);

  // Format distance in a user-friendly way
  const formatDistance = (meters) => {
    if (meters == null) return null;
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  // Confidence ring SVG
  const renderConfidenceRing = (score) => {
    const circ = 2 * Math.PI * 17;
    const offset = circ - (score / 100) * circ;
    let color = '#34d399';
    if (score < 50) color = '#fbbf24';
    else if (score < 70) color = '#60a5fa';
    else if (score < 90) color = '#a78bfa';
    return (
      <div className="dup-confidence-ring">
        <svg width="44" height="44" viewBox="0 0 44 44">
          <circle className="bg-ring" cx="22" cy="22" r="17" fill="none" strokeWidth="3.5" />
          <circle className="fg-ring" cx="22" cy="22" r="17" fill="none" strokeWidth="3.5"
            stroke={color} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className="dup-confidence-value">{score}%</span>
      </div>
    );
  };

  // Status badge class
  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'status-pending';
      case 'VERIFIED': return 'status-verified';
      case 'IN_PROGRESS': return 'status-progress';
      default: return '';
    }
  };

  // Severity badge class
  const getSeverityClass = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'LOW': return 'severity-low';
      case 'MEDIUM': return 'severity-medium';
      case 'HIGH': return 'severity-high';
      case 'CRITICAL': return 'severity-critical';
      default: return '';
    }
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="dup-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className="dup-modal"
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ duration: 0.3, type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="dup-header">
            <div className="dup-header-icon">
              <AlertTriangle size={20} color="white" />
            </div>
            <div className="dup-header-text">
              <h3>
                {loading
                  ? 'Checking for Similar Issues...'
                  : `Similar Issues Found (${duplicates.length})`}
              </h3>
              <p>
                {loading
                  ? 'AI is comparing your report with existing issues'
                  : 'These existing issues might be describing the same problem'}
              </p>
            </div>
            {!loading && (
              <button className="dup-close-btn" onClick={onDismiss} title="Close">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="dup-body">
            {loading ? (
              <div className="dup-loading">
                <div className="dup-spin">
                  <BrainCircuit size={32} color="#a78bfa" />
                </div>
                <p className="dup-loading-text">AI is analyzing similarity...</p>
                <p className="dup-loading-sub">Comparing descriptions, locations, and categories</p>
              </div>
            ) : (
              duplicates.map((dup, index) => (
                <motion.div
                  key={dup.issueId}
                  className="dup-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                >
                  {/* Card top: title + confidence ring */}
                  <div className="dup-card-top">
                    <div className="dup-card-title">{dup.title}</div>
                    {renderConfidenceRing(dup.confidenceScore)}
                  </div>

                  {/* Image thumbnail */}
                  {dup.imageUrl && (
                    <img src={dup.imageUrl} alt="Issue" className="dup-card-image" />
                  )}

                  {/* Meta badges */}
                  <div className="dup-meta-row">
                    <span className={`dup-badge ${getStatusClass(dup.status)}`}>
                      {dup.status?.replace('_', ' ')}
                    </span>
                    <span className={`dup-badge ${getSeverityClass(dup.severity)}`}>
                      {dup.severity}
                    </span>
                    <span className="dup-badge">
                      {dup.category?.replace(/_/g, ' ')}
                    </span>
                    {dup.upvoteCount > 0 && (
                      <span className="dup-upvote-count">
                        <ThumbsUp size={10} /> {dup.upvoteCount}
                      </span>
                    )}
                    {dup.createdAt && (
                      <span className="dup-time-ago">
                        <Clock size={10} /> {timeAgo(dup.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* Location + distance */}
                  {(dup.address || dup.distance != null) && (
                    <div className="dup-location-row">
                      <MapPin size={12} />
                      <span>{dup.address || 'Location on map'}</span>
                      {dup.distance != null && (
                        <span className="dup-distance-badge">
                          {formatDistance(dup.distance)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* AI match reason */}
                  {dup.matchReason && (
                    <div className="dup-match-reason">
                      <Sparkles size={11} />
                      {dup.matchReason}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="dup-card-actions">
                    <button
                      className="dup-btn-view"
                      onClick={() => handleViewIssue(dup.issueId)}
                    >
                      <Eye size={14} /> View Issue
                    </button>
                    <button
                      className="dup-btn-support"
                      onClick={() => handleSupportIssue(dup.issueId)}
                    >
                      <ThumbsUp size={14} /> Support This
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer — Continue creating new issue */}
          {!loading && (
            <div className="dup-footer">
              <button className="dup-btn-continue" onClick={onDismiss}>
                <ArrowRight size={16} />
                Not a Duplicate — Continue Reporting
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

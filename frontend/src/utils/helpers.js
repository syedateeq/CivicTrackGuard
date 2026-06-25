/**
 * Format date to "Jun 23, 2026"
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * Format date to relative time: "2 hours ago"
 */
export function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

/**
 * Get CSS class for status badge
 */
export function getStatusBadgeClass(status) {
  switch (status?.toUpperCase()) {
    case 'PENDING':     return 'badge-pending';
    case 'VERIFIED':    return 'badge-verified';
    case 'IN_PROGRESS': return 'badge-progress';
    case 'RESOLVED':    return 'badge-resolved';
    case 'REJECTED':    return 'badge-rejected';
    default:            return 'badge-pending';
  }
}

/**
 * Get CSS class for severity badge
 */
export function getSeverityBadgeClass(severity) {
  switch (severity?.toUpperCase()) {
    case 'HIGH':   return 'badge-high';
    case 'MEDIUM': return 'badge-medium';
    case 'LOW':    return 'badge-low';
    default:       return 'badge-low';
  }
}

/**
 * Get display label for status (with dot)
 */
export function getStatusLabel(status) {
  switch (status?.toUpperCase()) {
    case 'PENDING':     return '⏳ Pending';
    case 'VERIFIED':    return '✅ Verified';
    case 'IN_PROGRESS': return '🔧 In Progress';
    case 'RESOLVED':    return '✅ Resolved';
    case 'REJECTED':    return '❌ Rejected';
    default:            return status;
  }
}

/**
 * Truncate text to max length with ellipsis
 */
export function truncate(text, max = 120) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/**
 * Extract error message from Axios error
 */
export function getErrorMessage(error) {
  return error?.response?.data?.error
    || error?.response?.data?.message
    || error?.message
    || 'Something went wrong. Please try again.';
}

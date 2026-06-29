import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { ShieldCheck, Loader2, Search, Trash2, Edit3, X, CheckCircle, MapPin, AlertTriangle, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { getStatusBadgeClass, getSeverityBadgeClass, formatDate, truncate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import OfficerCopilot from '../../components/OfficerCopilot';
import ResolutionPlanCard from '../../components/ResolutionPlanCard';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Sanitation & Waste',
  'Water Supply',
  'Electricity Board',
  'Parks & Recreation',
  'Public Safety',
  'Other'
];

const AdminPanel = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [editingIssue, setEditingIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadIssues = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/issues');
      setIssues(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (showLoading) toast.error('Failed to load issues');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues(true);
    // Real-time polling every 10 seconds
    const interval = setInterval(() => {
      loadIssues(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this issue? This cannot be undone.')) return;
    try {
      await api.delete(`/issues/${id}`);
      setIssues(prev => prev.filter(i => i.id !== id));
      toast.success('Issue deleted');
    } catch (err) {
      toast.error('Failed to delete issue');
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingIssue) return;
    const isStatusChanged = newStatus !== editingIssue.status;
    const isDeptChanged = newDepartment !== (editingIssue.department || '');
    
    if (!isStatusChanged && !isDeptChanged) return;

    setStatusUpdating(true);
    try {
      const res = await api.put(`/issues/${editingIssue.id}/status`, { 
        status: newStatus,
        department: newDepartment || null
      });
      setIssues(prev => prev.map(i => i.id === res.data.id ? res.data : i));
      toast.success('Issue updated successfully');
      setEditingIssue(null);
    } catch (err) {
      toast.error('Failed to update issue');
    } finally {
      setStatusUpdating(false);
    }
  };

  const openEditModal = (issue) => {
    setEditingIssue(issue);
    setNewStatus(issue.status);
    setNewDepartment(issue.department || '');
  };

  const filteredIssues = issues.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    (i.reporterName && i.reporterName.toLowerCase().includes(search.toLowerCase())) ||
    i.status.toLowerCase().includes(search.toLowerCase()) ||
    (i.department && i.department.toLowerCase().includes(search.toLowerCase()))
  );

  // Summary stats
  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'PENDING').length,
    verified: issues.filter(i => i.status === 'VERIFIED').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: issues.filter(i => i.status === 'RESOLVED').length,
    rejected: issues.filter(i => i.status === 'REJECTED').length,
  };

  const StatCard = ({ icon: Icon, title, value, colorClass }) => (
    <div className={`glass rounded-2xl p-5 border border-white/5 flex items-center gap-4 ${colorClass}`}>
      <div className={`p-3 rounded-xl bg-current bg-opacity-20`}>
        <Icon size={24} className="text-current" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <ShieldCheck className="text-purple-400" size={32} />
          Admin Control Panel
        </h1>
        <p className="page-subtitle">Manage civic issues, update statuses, assign departments, and moderate content.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={FileText} title="Total" value={stats.total} colorClass="text-slate-400" />
        <StatCard icon={Clock} title="Pending" value={stats.pending} colorClass="text-yellow-500" />
        <StatCard icon={CheckCircle2} title="Verified" value={stats.verified} colorClass="text-blue-500" />
        <StatCard icon={AlertTriangle} title="In Progress" value={stats.inProgress} colorClass="text-orange-500" />
        <StatCard icon={CheckCircle} title="Resolved" value={stats.resolved} colorClass="text-green-500" />
        <StatCard icon={XCircle} title="Rejected" value={stats.rejected} colorClass="text-red-500" />
      </div>

      {/* Officer AI Copilot */}
      <OfficerCopilot />

      <div className="glass rounded-2xl p-6 border border-purple-500/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-bold text-white">All Issues ({issues.length})</h2>
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by title, status, reporter..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 py-2 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-slate-400">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Issue Details</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredIssues.map(issue => (
                  <tr key={issue.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500">#{issue.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-white truncate max-w-xs">{truncate(issue.title, 40)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">By {issue.reporterName || 'Anonymous'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadgeClass(issue.status)}>{issue.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {issue.department || <span className="text-slate-600 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {formatDate(issue.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button 
                        onClick={() => openEditModal(issue)}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors inline-flex"
                        title="View & Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(issue.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors inline-flex"
                        title="Delete Issue"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredIssues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No issues found matching "{search}"</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status & Details Modal */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass rounded-2xl p-6 border border-white/10 w-full max-w-4xl shadow-2xl my-auto">
            
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Issue #{editingIssue.id} Details & Management
              </h3>
              <button onClick={() => setEditingIssue(null)} className="text-slate-400 hover:text-white bg-white/5 p-1.5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Left Column: Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">{editingIssue.title}</h4>
                  <p className="text-sm text-slate-400">Reported by: <span className="text-white">{editingIssue.reporterName || 'Anonymous'}</span></p>
                </div>
                
                {editingIssue.imageUrl && (
                  <div className="w-full h-48 rounded-xl overflow-hidden border border-white/10 relative group">
                    <img src={editingIssue.imageUrl} alt="Issue" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-1">Description:</p>
                  <div className="p-3 bg-slate-900/50 rounded-xl text-sm text-slate-400 border border-white/5 max-h-32 overflow-y-auto">
                    {editingIssue.description || 'No description provided.'}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-slate-400">
                  <MapPin size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <p>{editingIssue.address}</p>
                </div>
              </div>

              {/* Right Column: Actions & Map */}
              <div className="space-y-5">
                {editingIssue.latitude && editingIssue.longitude && (
                  <div className="h-40 rounded-xl overflow-hidden border border-white/10 relative z-10">
                    <MapContainer 
                      center={[editingIssue.latitude, editingIssue.longitude]} 
                      zoom={15} 
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[editingIssue.latitude, editingIssue.longitude]} />
                    </MapContainer>
                  </div>
                )}

                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Update Status</label>
                    <select 
                      value={newStatus} 
                      onChange={e => setNewStatus(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="PENDING">PENDING (Awaiting Review)</option>
                      <option value="VERIFIED">VERIFIED (Valid Issue)</option>
                      <option value="IN_PROGRESS">IN PROGRESS (Being fixed)</option>
                      <option value="RESOLVED">RESOLVED (Completed)</option>
                      <option value="REJECTED">REJECTED (Spam/Invalid)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Assign Department</label>
                    <select 
                      value={newDepartment} 
                      onChange={e => setNewDepartment(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">-- Unassigned --</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Resolution Planner */}
            <div className="mb-6">
              <ResolutionPlanCard issueId={editingIssue.id} />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
              <button onClick={() => setEditingIssue(null)} className="btn-secondary px-4 py-2">Close</button>
              <button 
                onClick={handleUpdateStatus} 
                disabled={statusUpdating || (newStatus === editingIssue.status && newDepartment === (editingIssue.department || ''))}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                {statusUpdating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                {statusUpdating ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

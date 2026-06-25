import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import { Loader2, MapPin } from 'lucide-react';
import { getStatusBadgeClass, getSeverityBadgeClass } from '../utils/helpers';
import toast from 'react-hot-toast';

// Fix Leaflet default icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEVERITY_COLORS = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const createCustomIcon = (severity) => {
  const color = SEVERITY_COLORS[severity] || '#3b82f6';
  return L.divIcon({
    html: `<div style="
      width:24px; height:24px; border-radius:50% 50% 50% 0;
      background:${color}; border:3px solid white;
      transform:rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const MapPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/issues');
        const withCoords = (Array.isArray(res.data) ? res.data : [])
          .filter(i => i.latitude && i.longitude);
        setIssues(withCoords);
      } catch {
        toast.error('Failed to load map data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4 pb-10">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <MapPin className="text-primary-400" size={28} /> Issues Map
        </h1>
        <p className="page-subtitle">
          {issues.length} mapped issue{issues.length !== 1 ? 's' : ''}
          {' '}&nbsp;· Color shows severity: <span className="text-red-400">●</span> High &nbsp;
          <span className="text-amber-400">●</span> Medium &nbsp;
          <span className="text-emerald-400">●</span> Low
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin text-primary-500 w-10 h-10" />
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden border border-white/5" style={{ height: '70vh' }}>
          <MapContainer
            center={[20.5937, 78.9629]} // India center
            zoom={5}
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>'
            />
            {issues.map(issue => (
              <Marker
                key={issue.id}
                position={[issue.latitude, issue.longitude]}
                icon={createCustomIcon(issue.severity)}
              >
                <Popup className="leaflet-popup-dark">
                  <div className="p-1 min-w-48">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        issue.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' :
                        issue.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>{issue.status}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        issue.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                        issue.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>{issue.severity}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{issue.title}</h3>
                    {issue.address && <p className="text-xs text-slate-500 mb-2">{issue.address}</p>}
                    <a href={`/issues/${issue.id}`}
                      className="text-xs text-blue-600 font-semibold hover:underline">
                      View Details →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {!loading && issues.length === 0 && (
        <div className="glass rounded-2xl p-16 text-center border border-white/5">
          <MapPin size={40} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 font-medium">No mapped issues yet</p>
          <p className="text-slate-600 text-sm mt-1">Issues need latitude/longitude to appear on the map.</p>
          <Link to="/issues/new" className="btn-primary mt-4 inline-flex text-sm">
            Report an Issue with Location
          </Link>
        </div>
      )}
    </div>
  );
};

export default MapPage;

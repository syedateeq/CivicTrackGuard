import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Phone, MessageCircle, Search, AlertTriangle,
  Shield, Heart, Flame, Building2, Droplets,
  Zap, Construction, Trash2, ChevronRight,
  MapPin, Navigation, ExternalLink, LocateFixed, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Static demo service locations around Hyderabad, India
// Replace lat/lng with real backend/admin-managed coordinates later
const SERVICE_LOCATIONS = [
  { id: 'police',      name: 'Police Station',         address: 'Banjara Hills Police Station, Hyderabad',              lat: 17.4239, lng: 78.4483, color: '#3b82f6', glowColor: 'rgba(59,130,246,0.5)',  emoji: '\uD83D\uDE94', mapContactId: 2 },
  { id: 'hospital',    name: 'Government Hospital',     address: 'Osmania General Hospital, Afzalgunj, Hyderabad',       lat: 17.3850, lng: 78.4867, color: '#ec4899', glowColor: 'rgba(236,72,153,0.5)', emoji: '\uD83C\uDFE5', mapContactId: 3 },
  { id: 'fire',        name: 'Fire Station',            address: 'Begumpet Fire Station, Hyderabad',                     lat: 17.4448, lng: 78.4661, color: '#f97316', glowColor: 'rgba(249,115,22,0.5)', emoji: '\uD83D\uDE92', mapContactId: 4 },
  { id: 'municipal',   name: 'Municipal Office (GHMC)', address: 'GHMC Head Office, Tank Bund, Hyderabad',               lat: 17.4226, lng: 78.4741, color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.5)', emoji: '\uD83C\uDFDB\uFE0F', mapContactId: 5 },
  { id: 'water',       name: 'Water Department',        address: 'HMWSSB Head Office, Khairatabad, Hyderabad',           lat: 17.4118, lng: 78.4601, color: '#06b6d4', glowColor: 'rgba(6,182,212,0.5)',  emoji: '\uD83D\uDCA7', mapContactId: 6 },
  { id: 'electricity', name: 'Electricity Office',      address: 'TSSPDCL Corporate Office, Mint Compound, Hyderabad',  lat: 17.3750, lng: 78.4744, color: '#eab308', glowColor: 'rgba(234,179,8,0.5)',  emoji: '\u26A1', mapContactId: 7 },
];

const CONTACTS = [
  { id: 1, name: 'National Emergency',      description: 'Single emergency number for police, ambulance, fire & disaster.',           phone: '112',          whatsapp: null,             icon: Shield,      color: 'from-red-600 to-red-500',         glow: 'shadow-red-600/30',       badge: 'CRITICAL',  badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',           category: 'critical',  serviceId: null },
  { id: 2, name: 'Police',                  description: 'Report crime, vandalism, road accidents, or public disturbances.',          phone: '100',          whatsapp: null,             icon: Shield,      color: 'from-blue-600 to-blue-500',       glow: 'shadow-blue-600/30',      badge: 'CRITICAL',  badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',           category: 'critical',  serviceId: 'police' },
  { id: 3, name: 'Ambulance',               description: 'Medical emergencies, accidents, and urgent health situations.',             phone: '108',          whatsapp: null,             icon: Heart,       color: 'from-pink-600 to-rose-500',       glow: 'shadow-rose-600/30',      badge: 'CRITICAL',  badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',           category: 'critical',  serviceId: 'hospital' },
  { id: 4, name: 'Fire Service',            description: 'Fire breakouts, gas leaks, building collapses & rescue operations.',        phone: '101',          whatsapp: null,             icon: Flame,       color: 'from-orange-600 to-amber-500',    glow: 'shadow-orange-600/30',    badge: 'CRITICAL',  badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',           category: 'critical',  serviceId: 'fire' },
  { id: 5, name: 'Municipal Helpline',      description: 'General civic complaints — encroachments, noise, illegal structures.',      phone: '1800-XXX-1001', whatsapp: '+911800XXX1001', icon: Building2,   color: 'from-primary-600 to-violet-600',  glow: 'shadow-primary-600/30',   badge: 'MUNICIPAL', badgeColor: 'bg-primary-500/20 text-primary-400 border-primary-500/30', category: 'municipal', serviceId: 'municipal' },
  { id: 6, name: 'Water Department',        description: 'Water supply disruptions, leakage, contamination & pipeline issues.',       phone: '1800-XXX-1002', whatsapp: '+911800XXX1002', icon: Droplets,    color: 'from-cyan-600 to-sky-500',        glow: 'shadow-cyan-600/30',      badge: 'MUNICIPAL', badgeColor: 'bg-primary-500/20 text-primary-400 border-primary-500/30', category: 'municipal', serviceId: 'water' },
  { id: 7, name: 'Electricity Department',  description: 'Power outages, dangerous live wires, transformer faults & streetlights.',   phone: '1800-XXX-1003', whatsapp: '+911800XXX1003', icon: Zap,         color: 'from-yellow-500 to-amber-400',    glow: 'shadow-yellow-500/30',    badge: 'MUNICIPAL', badgeColor: 'bg-primary-500/20 text-primary-400 border-primary-500/30', category: 'municipal', serviceId: 'electricity' },
  { id: 8, name: 'Road Repair Department',  description: 'Potholes, broken footpaths, damaged dividers & road cave-ins.',            phone: '1800-XXX-1004', whatsapp: '+911800XXX1004', icon: Construction, color: 'from-slate-500 to-slate-400',     glow: 'shadow-slate-500/30',     badge: 'MUNICIPAL', badgeColor: 'bg-primary-500/20 text-primary-400 border-primary-500/30', category: 'municipal', serviceId: null },
  { id: 9, name: 'Waste Management',        description: 'Garbage collection failures, dumping complaints & sanitation issues.',      phone: '1800-XXX-1005', whatsapp: '+911800XXX1005', icon: Trash2,      color: 'from-emerald-600 to-green-500',   glow: 'shadow-emerald-600/30',   badge: 'MUNICIPAL', badgeColor: 'bg-primary-500/20 text-primary-400 border-primary-500/30', category: 'municipal', serviceId: null },
];

const CATEGORIES = [
  { id: 'all',       label: 'All',          count: CONTACTS.length },
  { id: 'critical',  label: '\uD83D\uDEA8 Critical',  count: CONTACTS.filter(c => c.category === 'critical').length },
  { id: 'municipal', label: '\uD83C\uDFD9\uFE0F Municipal', count: CONTACTS.filter(c => c.category === 'municipal').length },
];

// Custom service map marker icon
const createServiceIcon = (service, isHighlighted = false) => {
  const size = isHighlighted ? 38 : 30;
  const border = isHighlighted ? '3px solid white' : '2px solid white';
  const shadow = isHighlighted
    ? `0 0 0 3px white, 0 0 24px ${service.glowColor}, 0 4px 16px rgba(0,0,0,0.6)`
    : `0 0 14px ${service.glowColor}, 0 2px 10px rgba(0,0,0,0.4)`;
  return L.divIcon({
    html: `<div style="
      width:${size}px; height:${size}px; border-radius:50%;
      background:${service.color}; border:${border};
      display:flex; align-items:center; justify-content:center;
      font-size:${isHighlighted ? 20 : 15}px;
      box-shadow:${shadow};
      transition: all 0.3s ease;
    ">${service.emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
};

// User's current location marker
const userLocationIcon = L.divIcon({
  html: `<div style="
    width:18px; height:18px; border-radius:50%;
    background:linear-gradient(135deg,#3b82f6,#7c3aed);
    border:3px solid white;
    box-shadow: 0 0 0 6px rgba(59,130,246,0.25), 0 0 20px rgba(59,130,246,0.4);
  "></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Inner component: flies map to selected service or user location
const MapController = ({ selectedService, userLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedService) {
      map.flyTo([selectedService.lat, selectedService.lng], 15, { duration: 1.2 });
    }
  }, [selectedService, map]);
  useEffect(() => {
    if (userLocation && !selectedService) {
      map.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 1.2 });
    }
  }, [userLocation, map, selectedService]);
  return null;
};

// Contact card component
const ContactCard = ({ contact, index, isHighlighted, onClick, service }) => {
  const Icon = contact.icon;
  const waLink = contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}` : null;
  const mapsLink = service ? `https://www.google.com/maps/search/?api=1&query=${service.lat},${service.lng}` : null;

  const buttonCols = [1, waLink, mapsLink].filter(Boolean).length;
  const gridClass = buttonCols === 3 ? 'grid-cols-3' : buttonCols === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={service ? onClick : undefined}
      className={`glass rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 group
        ${service ? 'cursor-pointer hover:border-white/20' : 'hover:border-white/10'}
        ${isHighlighted ? 'border-white/25' : 'border-white/5'}`}
      style={isHighlighted && service ? {
        boxShadow: `0 0 0 2px ${service.color}55, 0 0 32px ${service.glowColor}`
      } : {}}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contact.color} flex items-center justify-center shrink-0 shadow-lg ${contact.glow} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white">{contact.name}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${contact.badgeColor}`}>{contact.badge}</span>
            {service && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                <MapPin size={8} /> MAP
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{contact.description}</p>
        </div>
      </div>

      {/* Phone */}
      <div className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-4 py-2.5 border border-slate-700/50">
        <Phone size={14} className="text-primary-400 shrink-0" />
        <span className="text-sm font-mono font-bold text-white tracking-wider">{contact.phone}</span>
      </div>

      {/* Address (if mapped) */}
      {service && (
        <div className="flex items-start gap-2 text-xs text-slate-400">
          <MapPin size={12} className="shrink-0 mt-0.5" style={{ color: service.color }} />
          <span>{service.address}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className={`grid gap-2 ${gridClass}`}>
        <a
          href={`tel:${contact.phone.replace(/\D/g, '')}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', boxShadow: '0 2px 12px rgba(37,99,235,0.3)' }}
        >
          <Phone size={14} /> Call
        </a>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600/80 hover:bg-emerald-600 transition-all duration-200 active:scale-95"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        )}
        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)', boxShadow: '0 2px 12px rgba(5,150,105,0.3)' }}
          >
            <ExternalLink size={14} /> Maps
          </a>
        )}
      </div>

      {service && !isHighlighted && (
        <p className="text-[10px] text-slate-600 text-center -mt-1 flex items-center justify-center gap-1">
          <MapPin size={9} /> Click card to highlight on map
        </p>
      )}
    </motion.div>
  );
};

// Map section component
const MapSection = ({ selectedService, userLocation, locationStatus, onRequestLocation, onMarkerClick }) => {
  const DEFAULT_CENTER = [17.3980, 78.4680];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl overflow-hidden border border-white/10"
      style={{
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Map card header */}
      <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Nearby Services Map</h2>
            <p className="text-xs text-slate-400">Click a card or map marker to highlight</p>
          </div>
        </div>
        <button
          id="locate-me-btn"
          onClick={onRequestLocation}
          disabled={locationStatus === 'denied'}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 active:scale-95
            ${locationStatus === 'granted'
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
              : locationStatus === 'denied'
              ? 'bg-red-500/10 border-red-500/30 text-red-400 cursor-not-allowed opacity-60'
              : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-slate-600'}`}
          title={locationStatus === 'denied' ? 'Location permission denied' : 'Use my location'}
        >
          <LocateFixed size={14} className={locationStatus === 'granted' ? 'text-blue-400' : ''} />
          {locationStatus === 'granted' ? 'Located' : locationStatus === 'denied' ? 'Denied' : 'Locate Me'}
        </button>
      </div>

      {/* Service legend / quick-jump chips */}
      <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-white/5">
        {SERVICE_LOCATIONS.map(svc => (
          <button
            key={svc.id}
            onClick={() => onMarkerClick(svc)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200
              ${selectedService?.id === svc.id
                ? 'border-white/30 bg-white/10 text-white scale-105'
                : 'border-white/5 bg-slate-800/40 text-slate-400 hover:border-white/15 hover:text-slate-200'}`}
          >
            <span style={{ color: svc.color }}>{svc.emoji}</span>
            <span className="hidden sm:inline">{svc.name}</span>
          </button>
        ))}
      </div>

      {/* Map container */}
      <div style={{ height: '420px', position: 'relative' }}>
        {locationStatus === 'denied' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border"
            style={{
              background: 'rgba(239,68,68,0.15)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(239,68,68,0.3)',
              color: '#fca5a5',
              whiteSpace: 'nowrap',
            }}>
            <AlertTriangle size={13} />
            Location access denied — showing demo coordinates
          </div>
        )}
        <MapContainer
          center={userLocation ? [userLocation.lat, userLocation.lng] : DEFAULT_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          />

          {SERVICE_LOCATIONS.map(svc => (
            <Marker
              key={svc.id}
              position={[svc.lat, svc.lng]}
              icon={createServiceIcon(svc, selectedService?.id === svc.id)}
              eventHandlers={{ click: () => onMarkerClick(svc) }}
            >
              <Popup>
                <div style={{ minWidth: '190px', fontFamily: 'Inter, sans-serif', padding: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '22px' }}>{svc.emoji}</span>
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>{svc.name}</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px', lineHeight: '1.5' }}>{svc.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${svc.lat},${svc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      fontSize: '11px', fontWeight: '700', color: '#2563eb',
                      textDecoration: 'none', padding: '5px 10px',
                      background: '#eff6ff', borderRadius: '8px',
                    }}
                  >
                    Open in Google Maps &rarr;
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600' }}>
                  Your Location
                </div>
              </Popup>
            </Marker>
          )}

          <MapController selectedService={selectedService} userLocation={userLocation} />
        </MapContainer>
      </div>

      {/* Selected service info bar */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}
            className="px-5 py-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl shrink-0">{selectedService.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{selectedService.name}</p>
                <p className="text-xs text-slate-400 truncate">{selectedService.address}</p>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedService.lat},${selectedService.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white whitespace-nowrap transition-all duration-200 hover:opacity-90 active:scale-95 shrink-0"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)', boxShadow: '0 2px 12px rgba(5,150,105,0.3)' }}
            >
              <Navigation size={13} /> Open in Maps
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main page component
const EmergencyContacts = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');

  const filtered = useMemo(() => {
    return CONTACTS.filter(c => {
      const matchCategory = activeCategory === 'all' || c.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [search, activeCategory]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationStatus('denied'); return; }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus('granted'); },
      () => setLocationStatus('denied'),
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  const handleCardClick = useCallback((contact) => {
    if (!contact.serviceId) return;
    const svc = SERVICE_LOCATIONS.find(s => s.id === contact.serviceId);
    if (svc) setSelectedService(prev => prev?.id === svc.id ? null : svc);
    // Scroll map into view on mobile
    document.getElementById('emergency-map-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleMarkerClick = useCallback((svc) => {
    setSelectedService(prev => prev?.id === svc.id ? null : svc);
  }, []);

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <span className="text-3xl">\uD83D\uDEA8</span>
          Emergency Contacts
        </h1>
        <p className="page-subtitle mt-1">
          Reach the right department fast. Save these numbers before you need them.
        </p>
      </div>

      {/* Emergency alert banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10"
      >
        <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-300">Serious Emergency?</p>
          <p className="text-xs text-red-400/80 mt-0.5">
            For immediate life-threatening situations, call the National Emergency number{' '}
            <a href="tel:112" className="font-black text-red-300 underline underline-offset-2 hover:no-underline">112</a>{' '}
            first. The contacts below are for civic department follow-ups.
          </p>
        </div>
      </motion.div>

      {/* Quick dial strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Police',    num: '100', color: 'from-blue-600 to-blue-500' },
          { label: 'Ambulance', num: '108', color: 'from-pink-600 to-rose-500' },
          { label: 'Fire',      num: '101', color: 'from-orange-600 to-amber-500' },
          { label: 'Emergency', num: '112', color: 'from-red-600 to-red-500' },
        ].map(({ label, num, color }) => (
          <a
            key={num}
            href={`tel:${num}`}
            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-gradient-to-br ${color} text-white font-bold shadow-lg transition-transform active:scale-95 hover:opacity-90`}
          >
            <span className="text-2xl font-black">{num}</span>
            <span className="text-xs font-semibold opacity-80">{label}</span>
          </a>
        ))}
      </div>

      {/* Map section */}
      <div id="emergency-map-section">
        <MapSection
          selectedService={selectedService}
          userLocation={userLocation}
          locationStatus={locationStatus}
          onRequestLocation={requestLocation}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                activeCategory === cat.id
                  ? 'bg-primary-600/20 border-primary-500/40 text-primary-300'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {cat.label}
              <span className="ml-1.5 text-xs opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl border border-white/5 p-16 text-center">
          <Search size={40} className="mx-auto mb-4 text-slate-700" />
          <p className="text-slate-400 font-medium">No departments found.</p>
          <p className="text-slate-600 text-sm mt-1">Try a different search term or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((contact, i) => {
            const service = contact.serviceId ? SERVICE_LOCATIONS.find(s => s.id === contact.serviceId) : null;
            return (
              <ContactCard
                key={contact.id}
                contact={contact}
                index={i}
                isHighlighted={!!(service && selectedService?.id === service?.id)}
                onClick={() => handleCardClick(contact)}
                service={service}
              />
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="glass rounded-2xl border border-white/5 p-4 flex items-start gap-3">
        <ChevronRight size={16} className="text-primary-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">Note:</span> The municipal helpline numbers and map coordinates are demo values.
          Your admin can update them with real department numbers and geolocations from the Admin Panel once backend support is added.
        </p>
      </div>
    </div>
  );
};

export default EmergencyContacts;

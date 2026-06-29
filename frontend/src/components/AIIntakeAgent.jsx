import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  BrainCircuit, Mic, MicOff, Upload, MapPin, Sparkles,
  Loader2, CheckCircle, X, ImagePlus, RotateCcw, ChevronDown,
  ChevronUp, Clock, Shield, Tag, Zap, AlertTriangle, ArrowRight,
  FileEdit
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axiosConfig';
import { getErrorMessage } from '../utils/helpers';
import './AIIntakeAgent.css';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const AI_MARKER_ICON = L.divIcon({
  html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#7c3aed,#3b82f6);border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 10px rgba(124,58,237,0.5);"></div>`,
  className: '', iconSize: [24, 24], iconAnchor: [12, 24],
});

const QUICK_EXAMPLES = [
  { emoji: '🕳️', text: 'Pothole on road' },
  { emoji: '💧', text: 'Water leakage from pipe' },
  { emoji: '🗑️', text: 'Garbage overflow' },
  { emoji: '💡', text: 'Broken streetlight' },
  { emoji: '🚮', text: 'Illegal dumping' },
  { emoji: '🚧', text: 'Damaged footpath' },
  { emoji: '🚦', text: 'Traffic signal not working' },
  { emoji: '⚡', text: 'Exposed electric wire' },
];

const SEVERITY_CONFIG = {
  LOW:      { color: '#34d399', label: 'Low' },
  MEDIUM:   { color: '#fbbf24', label: 'Medium' },
  HIGH:     { color: '#f87171', label: 'High' },
  CRITICAL: { color: '#c084fc', label: 'Critical' },
};

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

export default function AIIntakeAgent({ onAiComplete, onSkipToManual }) {
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const analyzeRequestRef = useRef(null);

  // Speech Recognition
  const speechSupported = useMemo(() =>
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window), []
  );

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Voice input not supported'); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalTranscript = description;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
          setDescription(finalTranscript);
        } else { interim = transcript; }
      }
      if (interim) setDescription(finalTranscript + (finalTranscript ? ' ' : '') + interim);
    };
    recognition.onerror = (e) => { if (e.error !== 'aborted') toast.error('Voice error: ' + e.error); setIsListening(false); };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    toast.success('Listening... Speak now', { icon: '🎙️' });
  }, [isListening, description]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  // Image
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl('');
  }, []);

  const handleUploadImage = useCallback(async () => {
    if (!imageFile) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      const res = await api.post('/issues/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImageUrl(res.data?.imageUrl || res.data);
      toast.success('Image uploaded ✓');
    } catch (err) { toast.error('Upload failed: ' + getErrorMessage(err)); }
    finally { setUploadingImage(false); }
  }, [imageFile]);

  const removeImage = useCallback(() => {
    setImageFile(null); setImagePreview(''); setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Location
  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGettingLocation(true);
    const tid = toast.loading('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setLatitude(lat); setLongitude(lng);
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, { headers: { 'Accept-Language': 'en' } });
          const d = await r.json();
          if (d.display_name) setAddress(d.display_name);
        } catch { /* ok */ }
        toast.dismiss(tid); toast.success('Location captured!'); setGettingLocation(false);
      },
      () => { toast.dismiss(tid); toast.error('Unable to get location'); setGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleMapClick = useCallback(async (latlng) => {
    setLatitude(latlng.lat); setLongitude(latlng.lng);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`, { headers: { 'Accept-Language': 'en' } });
      const d = await r.json();
      if (d.display_name) setAddress(d.display_name);
    } catch { /* ok */ }
  }, []);

  const handleAddressSearch = useCallback(async () => {
    if (!address.trim()) return;
    const tid = toast.loading('Searching...');
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, { headers: { 'Accept-Language': 'en' } });
      const d = await r.json();
      if (d.length > 0) {
        setLatitude(parseFloat(d[0].lat)); setLongitude(parseFloat(d[0].lon)); setAddress(d[0].display_name);
        toast.dismiss(tid); toast.success('Location found!');
      } else { toast.dismiss(tid); toast.error('Not found. Try a more specific address.'); }
    } catch { toast.dismiss(tid); toast.error('Search failed'); }
  }, [address]);

  // Typing animation
  const typeText = useCallback((text) => {
    setIsTyping(true); setTypingText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) { setTypingText(text.substring(0, i + 1)); i++; }
      else { clearInterval(interval); setIsTyping(false); }
    }, 12);
    return () => clearInterval(interval);
  }, []);

  // AI Analysis — tries /ai/intake first, falls back to /ai/analyze
  const handleAnalyze = useCallback(async () => {
    if (!description.trim() || description.trim().length < 10) {
      toast.error('Please describe the issue in at least 10 characters');
      return;
    }
    if (analyzeRequestRef.current) return;

    setAnalyzing(true);
    setAiResult(null);

    // Auto-upload image if needed
    let finalImageUrl = imageUrl;
    if (imageFile && !imageUrl) {
      try {
        const fd = new FormData();
        fd.append('file', imageFile);
        const res = await api.post('/issues/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        finalImageUrl = res.data?.imageUrl || res.data;
        setImageUrl(finalImageUrl);
      } catch { /* continue without image */ }
    }

    analyzeRequestRef.current = true;

    try {
      // Try the enhanced intake endpoint first
      const res = await api.post('/ai/intake', {
        description: description.trim(),
        imageUrl: finalImageUrl || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        address: address || undefined,
      });
      const result = res.data;
      setAiResult(result);
      if (result.summary) typeText(result.summary);
      toast.success('AI analysis complete! 🎉');
    } catch (intakeErr) {
      console.warn('AI intake failed, trying fallback /ai/analyze:', intakeErr);
      // Fallback to old /ai/analyze endpoint
      try {
        const fallbackRes = await api.post('/ai/analyze', {
          title: description.trim().substring(0, 80),
          description: description.trim(),
          location: address || undefined,
          imageUrl: finalImageUrl || undefined,
        });
        const fb = fallbackRes.data;
        // Normalize old format to intake format
        setAiResult({
          title: description.trim().substring(0, 80),
          category: fb.category || 'OTHER',
          severity: fb.severity || 'MEDIUM',
          department: fb.department || 'Municipality',
          summary: fb.summary || '',
          priority: fb.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
          tags: [],
          suggestedResolution: fb.recommendedAction || '',
          estimatedResolutionTime: '3-5 business days',
          confidenceScore: fb.trustScore || 60,
          reasoning: fb.explanation || '',
        });
        if (fb.summary) typeText(fb.summary);
        toast.success('AI analysis complete (fallback)');
      } catch (fallbackErr) {
        console.error('Both AI endpoints failed:', fallbackErr);
        toast.error('AI analysis failed. Please use the manual form.');
        // Switch to manual form on complete failure
        onSkipToManual();
      }
    } finally {
      setAnalyzing(false);
      analyzeRequestRef.current = null;
    }
  }, [description, imageUrl, imageFile, latitude, longitude, address, typeText, onSkipToManual]);

  // Auto-fill handler
  const handleAutoFill = useCallback(() => {
    if (!aiResult) return;
    onAiComplete({
      title: aiResult.title || '',
      description: description,
      category: aiResult.category || 'OTHER',
      severity: aiResult.severity || 'MEDIUM',
      department: aiResult.department || '',
      address: address || '',
      latitude: latitude ? String(latitude) : '',
      longitude: longitude ? String(longitude) : '',
      imageUrl: imageUrl || '',
      aiSummary: aiResult.summary || '',
      aiExplanation: aiResult.reasoning || '',
      trustScore: aiResult.confidenceScore || 0,
      priority: aiResult.priority || 'MEDIUM',
      tags: (aiResult.tags || []).join(', '),
      suggestedResolution: aiResult.suggestedResolution || '',
      estimatedResolutionTime: aiResult.estimatedResolutionTime || '',
    });
    toast.success('Form auto-filled! Review and submit below 👇');
  }, [aiResult, description, address, latitude, longitude, imageUrl, onAiComplete]);

  // Step calc
  const currentStep = useMemo(() => {
    if (aiResult) return 4;
    if (analyzing) return 4;
    if (latitude && longitude) return 3;
    if (imageFile || imageUrl) return 2;
    if (description.trim().length > 0) return 1;
    return 0;
  }, [description, imageFile, imageUrl, latitude, longitude, analyzing, aiResult]);

  // Confidence ring
  const renderConfidenceRing = (score) => {
    const circ = 2 * Math.PI * 20;
    const offset = circ - (score / 100) * circ;
    let color = '#34d399';
    if (score < 50) color = '#f87171';
    else if (score < 70) color = '#fbbf24';
    else if (score < 90) color = '#3b82f6';
    return (
      <div className="ai-confidence-ring">
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle className="bg-ring" cx="26" cy="26" r="20" fill="none" strokeWidth="4" />
          <circle className="fg-ring" cx="26" cy="26" r="20" fill="none" strokeWidth="4"
            stroke={color} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className="ai-confidence-value">{score}</span>
      </div>
    );
  };

  return (
    <div className="ai-intake">
      <div className="ai-intake-card">
        {/* Header */}
        <div className="ai-intake-header">
          <div className="ai-intake-icon-wrap">
            <BrainCircuit size={22} color="white" />
          </div>
          <div>
            <h2 className="ai-intake-title">AI Reporting Assistant</h2>
            <p className="ai-intake-subtitle">Describe the issue naturally — our AI handles the rest</p>
          </div>
        </div>

        {/* Step progress */}
        <div className="ai-steps">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`ai-step-dot ${step <= currentStep ? (step < currentStep ? 'done' : 'active') : ''}`} />
          ))}
        </div>

        {/* STEP 1: Natural Language */}
        <div className="ai-section">
          <div className="ai-textarea-wrap">
            <textarea
              className="ai-textarea"
              placeholder={"Describe the civic issue in your own words...\n\nExample: There is a huge pothole near KL University Gate 2. Water is collecting there and two bikes slipped this morning."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={3000}
              disabled={analyzing}
            />
            <span className="ai-char-count">{description.length}/3000</span>
            {speechSupported && (
              <button type="button" className={`ai-voice-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleVoice} title={isListening ? 'Stop listening' : 'Voice input'}>
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
          </div>
          <div className="ai-examples">
            {QUICK_EXAMPLES.map((ex) => (
              <button key={ex.text} type="button" className="ai-example-chip"
                onClick={() => setDescription(prev => prev ? prev + ' ' + ex.text : ex.text)}>
                {ex.emoji} {ex.text}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-divider" />

        {/* STEP 2: Image Upload */}
        <div className="ai-section">
          <div className="ai-section-label">
            <ImagePlus size={13} /> Photo Evidence <span className="ai-section-optional">Optional</span>
          </div>
          {imagePreview ? (
            <div className="ai-image-preview-wrap">
              <img src={imagePreview} alt="Issue preview" />
              <button type="button" className="ai-remove-btn" onClick={removeImage}><X size={14} /></button>
              {imageUrl ? (
                <div className="ai-image-uploaded-badge"><CheckCircle size={12} /> Uploaded</div>
              ) : (
                <div className="ai-image-upload-overlay">
                  <button type="button" onClick={handleUploadImage} disabled={uploadingImage}
                    className="btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', borderRadius: '0.625rem' }}>
                    {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploadingImage ? ' Uploading...' : ' Upload Image'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <label className="ai-upload-zone">
              <ImagePlus size={24} style={{ color: '#64748b', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#94a3b8' }}>Click to upload an image</div>
              <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.25rem' }}>JPG, PNG • Max 10 MB</div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} />
            </label>
          )}
        </div>

        <div className="ai-divider" />

        {/* STEP 3: Location */}
        <div className="ai-section">
          <div className="ai-section-label">
            <MapPin size={13} /> Location <span className="ai-section-optional">Optional</span>
          </div>
          <div className="ai-location-btns">
            <button type="button" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.875rem' }}
              onClick={useCurrentLocation} disabled={gettingLocation}>
              {gettingLocation ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
              {gettingLocation ? ' Getting...' : ' Current Location'}
            </button>
            <button type="button" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.875rem' }}
              onClick={() => setShowMap(!showMap)}>
              {showMap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showMap ? ' Hide Map' : ' Pick on Map'}
            </button>
          </div>

          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <input type="text" className="input-field" style={{ fontSize: '0.85rem', padding: '0.625rem 0.875rem' }}
              placeholder="Search address or landmark..." value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())} />
            <button type="button" className="btn-secondary" style={{ padding: '0.625rem 0.75rem', flexShrink: 0 }}
              onClick={handleAddressSearch}>Search</button>
          </div>

          <AnimatePresence>
            {showMap && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                <div className="ai-map-container">
                  <MapContainer center={latitude && longitude ? [latitude, longitude] : [20.5937, 78.9629]}
                    zoom={latitude && longitude ? 15 : 5} style={{ height: '100%', width: '100%', background: '#0f172a' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; OpenStreetMap &copy; CARTO' />
                    <MapClickHandler onMapClick={handleMapClick} />
                    {latitude && longitude && <Marker position={[latitude, longitude]} icon={AI_MARKER_ICON} />}
                  </MapContainer>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.375rem', textAlign: 'center' }}>
                  Click on the map to set the issue location
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {latitude && longitude && (
            <div className="ai-coords-row">
              <div><span>Lat:</span> {Number(latitude).toFixed(6)}</div>
              <div><span>Lng:</span> {Number(longitude).toFixed(6)}</div>
            </div>
          )}
        </div>

        <div className="ai-divider" />

        {/* STEP 4: Analyze Button */}
        {!aiResult && !analyzing && (
          <button type="button" className="ai-analyze-btn" onClick={handleAnalyze}
            disabled={!description.trim() || description.trim().length < 10}>
            <Sparkles size={20} /> Analyze with AI
          </button>
        )}

        {/* Analyzing Animation */}
        <AnimatePresence>
          {analyzing && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} className="ai-analyzing">
              <div className="ai-brain-pulse"><BrainCircuit size={28} color="#a78bfa" /></div>
              <p className="ai-analyzing-text">AI is analyzing your report...</p>
              <p className="ai-analyzing-sub">Extracting details, classifying issue, routing to department</p>
              <div className="ai-skeleton">
                <div className="ai-skeleton-line" style={{ width: '80%' }} />
                <div className="ai-skeleton-line" style={{ width: '60%' }} />
                <div className="ai-skeleton-line" style={{ width: '90%' }} />
                <div className="ai-skeleton-line" style={{ width: '45%' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Result Card */}
        <AnimatePresence>
          {aiResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="ai-result-card">
              <div className="ai-result-header">
                <div className="ai-result-header-left">
                  <Sparkles size={16} color="#a78bfa" />
                  <h3>AI Analysis Complete</h3>
                </div>
              </div>

              <div className="ai-result-body">
                {/* Title */}
                <div className="ai-info-section">
                  <div className="ai-info-label">Generated Title</div>
                  <div className="ai-info-text" style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f1f5f9' }}>
                    {aiResult.title}
                  </div>
                </div>

                {/* Confidence */}
                <div className="ai-confidence-wrap">
                  {renderConfidenceRing(aiResult.confidenceScore || 0)}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
                      AI Confidence: {aiResult.confidenceScore}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.125rem' }}>
                      {aiResult.confidenceScore >= 90 ? 'Very high — detailed report' :
                       aiResult.confidenceScore >= 70 ? 'Good — most details extracted' :
                       aiResult.confidenceScore >= 50 ? 'Moderate — please review' :
                       'Low — review carefully'}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="ai-badges-grid">
                  <div className="ai-badge-card">
                    <div className="ai-badge-label">Severity</div>
                    <div className="ai-badge-value" style={{ color: SEVERITY_CONFIG[aiResult.severity]?.color || '#94a3b8' }}>
                      <span className={`severity-dot ${aiResult.severity?.toLowerCase()}`} />
                      {SEVERITY_CONFIG[aiResult.severity]?.label || aiResult.severity}
                    </div>
                  </div>
                  <div className="ai-badge-card">
                    <div className="ai-badge-label">Category</div>
                    <div className="ai-badge-value" style={{ color: '#93c5fd' }}>
                      {aiResult.category?.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="ai-badge-card">
                    <div className="ai-badge-label">Department</div>
                    <div className="ai-badge-value" style={{ color: '#c4b5fd' }}>
                      {aiResult.department}
                    </div>
                  </div>
                  <div className="ai-badge-card">
                    <div className="ai-badge-label">Priority</div>
                    <div className="ai-badge-value" style={{ color: aiResult.priority === 'URGENT' ? '#f87171' : aiResult.priority === 'HIGH' ? '#fbbf24' : '#94a3b8' }}>
                      <Zap size={11} /> {aiResult.priority}
                    </div>
                  </div>
                </div>

                {/* Summary with typing */}
                {aiResult.summary && (
                  <div className="ai-info-section">
                    <div className="ai-info-label">Summary</div>
                    <div className="ai-info-text">
                      {isTyping ? <>{typingText}<span className="ai-typing-cursor" /></> : aiResult.summary}
                    </div>
                  </div>
                )}

                {/* Estimated Resolution */}
                {aiResult.estimatedResolutionTime && (
                  <div className="ai-info-section">
                    <div className="ai-info-label"><Clock size={10} /> Est. Resolution Time</div>
                    <div className="ai-info-text">{aiResult.estimatedResolutionTime}</div>
                  </div>
                )}

                {/* Suggested Resolution */}
                {aiResult.suggestedResolution && (
                  <div className="ai-info-section">
                    <div className="ai-info-label"><Shield size={10} /> Suggested Resolution</div>
                    <div className="ai-info-text">{aiResult.suggestedResolution}</div>
                  </div>
                )}

                {/* Reasoning */}
                {aiResult.reasoning && (
                  <div className="ai-info-section">
                    <div className="ai-info-label"><AlertTriangle size={10} /> AI Reasoning</div>
                    <div className="ai-info-text" style={{ fontStyle: 'italic', color: '#94a3b8' }}>{aiResult.reasoning}</div>
                  </div>
                )}

                {/* Tags */}
                {aiResult.tags && aiResult.tags.length > 0 && (
                  <div className="ai-info-section">
                    <div className="ai-info-label"><Tag size={10} /> Tags</div>
                    <div className="ai-tags">
                      {aiResult.tags.map((tag, i) => <span key={i} className="ai-tag">{tag}</span>)}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="ai-result-actions">
                  <button type="button" className="ai-btn-fill" onClick={handleAutoFill}>
                    <CheckCircle size={16} /> Fill Form & Review <ArrowRight size={14} />
                  </button>
                  <button type="button" className="ai-btn-retry"
                    onClick={() => { setAiResult(null); setTypingText(''); }}>
                    <RotateCcw size={14} /> Retry
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Switch to manual form */}
        {!analyzing && (
          <button type="button" className="ai-switch-btn" onClick={onSkipToManual}>
            <FileEdit size={14} /> Use Manual Form Instead
          </button>
        )}
      </div>
    </div>
  );
}

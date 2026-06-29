import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { 
  Upload, MapPin, BrainCircuit, Send, Loader2, AlertCircle,
  CheckCircle, X, ImagePlus, Sparkles, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/helpers';
import AIIntakeAgent from '../components/AIIntakeAgent';

const CATEGORIES = [
  { value: 'ROAD_DAMAGE',    label: '🛣️ Road Damage' },
  { value: 'GARBAGE',        label: '🗑️ Garbage / Waste' },
  { value: 'WATER_LEAKAGE',  label: '💧 Water Leakage' },
  { value: 'STREETLIGHT',    label: '💡 Streetlight' },
  { value: 'ELECTRICITY',    label: '⚡ Electricity' },
  { value: 'SEWAGE',         label: '🚿 Sewage / Drains' },
  { value: 'TRAFFIC',        label: '🚦 Traffic' },
  { value: 'PUBLIC_SAFETY',  label: '🛡️ Public Safety' },
  { value: 'OTHER',          label: '📋 Other' },
];

const SEVERITIES = [
  { value: 'LOW',      label: 'Low',      color: 'text-green-400 border-green-500/30 bg-green-500/10' },
  { value: 'MEDIUM',   label: 'Medium',   color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { value: 'HIGH',     label: 'High',     color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
];

const SEVERITY_COLORS = {
  HIGH: 'border-red-500/40 bg-red-500/10 text-red-400',
  MEDIUM: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  LOW: 'border-green-500/40 bg-green-500/10 text-green-400',
  CRITICAL: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
};

const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', category: 'ROAD_DAMAGE', address: '',
    latitude: '', longitude: '', imageUrl: '', severity: '',
    department: '', priority: '', tags: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiPopulated, setAiPopulated] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const formRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please allow camera access.');
      } else {
        toast.error('Unable to access camera: ' + getErrorMessage(err));
      }
    }
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to capture photo');
          return;
        }
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        stopCamera();
        toast.success('Photo captured — you can upload it now');
      }, 'image/jpeg', 0.8);
    }
  };

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    toast.success('Image selected — upload it before submitting');
  };

  const handleUploadImage = async () => {
    if (!imageFile) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      const res = await api.post('/issues/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.imageUrl || res.data;
      setForm(prev => ({ ...prev, imageUrl: url }));
      toast.success('Image uploaded successfully ✓');
    } catch (err) {
      toast.error('Image upload failed: ' + getErrorMessage(err));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAnalyze = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Please fill in title and description first');
      return;
    }
    setAnalyzing(true);
    setAiResult(null);
    try {
      const res = await api.post('/ai/analyze', {
        title: form.title,
        description: form.description,
        location: form.address || undefined,
        imageUrl: form.imageUrl || undefined,
      });
      setAiResult(res.data);
      // Auto-fill category if detected
      if (res.data.category) {
        setForm(prev => ({ ...prev, category: res.data.category }));
      }
      if (res.data.severity) {
        setForm(prev => ({ ...prev, severity: res.data.severity }));
      }
      toast.success('AI analysis complete!');
    } catch (err) {
      toast.error('AI analysis failed — you can still submit manually');
    } finally {
      setAnalyzing(false);
    }
  };

  // --- AI Intake Agent callback ---
  const handleAiIntakeComplete = useCallback((aiData) => {
    setForm({
      title: aiData.title || '',
      description: aiData.description || '',
      category: aiData.category || 'OTHER',
      address: aiData.address || '',
      latitude: aiData.latitude || '',
      longitude: aiData.longitude || '',
      imageUrl: aiData.imageUrl || '',
      severity: aiData.severity || 'MEDIUM',
      department: aiData.department || '',
      priority: aiData.priority || '',
      tags: aiData.tags || '',
    });

    // Set AI result for display
    setAiResult({
      category: aiData.category,
      severity: aiData.severity,
      department: aiData.department,
      summary: aiData.aiSummary,
      explanation: aiData.aiExplanation,
      trustScore: aiData.trustScore,
      recommendedAction: aiData.suggestedResolution,
    });

    // Set image preview if we have an image URL
    if (aiData.imageUrl) {
      setImagePreview(aiData.imageUrl);
    }

    setAiPopulated(true);
    setShowManualForm(true);

    // Scroll to form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setError('');
    setSubmitting(true);

    let finalImageUrl = form.imageUrl;

    // Auto-upload image if user selected one but forgot to click upload
    if (imageFile && !form.imageUrl) {
      toast.loading('Uploading image...', { id: 'upload-toast' });
      try {
        const fd = new FormData();
        fd.append('file', imageFile);
        const res = await api.post('/issues/upload-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = res.data?.imageUrl || res.data;
        setForm(prev => ({ ...prev, imageUrl: finalImageUrl }));
        toast.success('Image uploaded successfully ✓', { id: 'upload-toast' });
      } catch (err) {
        toast.error('Image upload failed: ' + getErrorMessage(err), { id: 'upload-toast' });
        setSubmitting(false);
        return; // Stop submission if image upload fails
      }
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        address: form.address || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        imageUrl: finalImageUrl || undefined,
        severity: form.severity || undefined,
        department: form.department || undefined,
        priority: form.priority || undefined,
        tags: form.tags || undefined,
        // Pass AI results if available
        ...(aiResult && {
          aiSummary: aiResult.summary,
          aiExplanation: aiResult.explanation,
          trustScore: aiResult.trustScore,
        }),
      };
      const res = await api.post('/issues', payload);
      toast.success('Issue reported successfully! 🎉');
      navigate(`/issues/${res.data.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    const id = toast.loading('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.dismiss(id);
        toast.success('Location captured!');
      },
      () => {
        toast.dismiss(id);
        toast.error('Unable to get location');
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="page-header text-center mb-8">
        <h1 className="page-title text-3xl font-extrabold text-slate-100 flex items-center justify-center gap-2">
          <BrainCircuit size={28} className="text-purple-400 animate-pulse" />
          Report a Civic Issue
        </h1>
        <p className="page-subtitle text-slate-400 mt-2">
          Describe the civic problem. Use our AI Assistant or fill out the form manually.
        </p>
      </div>

      {/* ===== AI Intake Agent ===== */}
      {!showManualForm && (
        <AIIntakeAgent
          onAiComplete={handleAiIntakeComplete}
          onSkipToManual={() => {
            setShowManualForm(true);
            setAiPopulated(false);
          }}
        />
      )}

      {/* AI Populated Banner / Switch back to AI */}
      {showManualForm && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-start gap-3 text-slate-300">
            {aiPopulated ? (
              <>
                <CheckCircle size={18} className="shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Form auto-filled by AI</p>
                  <p className="text-xs text-slate-400 mt-0.5">Review the extracted details, modify anything, then submit.</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-400">Manual Issue Report Form</p>
                  <p className="text-xs text-slate-400 mt-0.5">You can switch back to the AI Assistant anytime.</p>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setShowManualForm(false);
              setAiPopulated(false);
              setAiResult(null);
            }}
            className="w-full md:w-auto btn-secondary text-sm py-2 px-4 flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <BrainCircuit size={15} className="text-purple-400 animate-pulse" />
            Back to AI Assistant
          </button>
        </div>
      )}

      {/* ===== Manual / Review Form ===== */}
      {showManualForm && (
        <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Title + Description */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Issue Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
              <input type="text" name="title" required maxLength={150}
                className="input-field" placeholder="e.g. Large pothole on MG Road near Signal 4"
                value={form.title} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
              <textarea name="description" required rows={5} maxLength={2000}
                className="input-field resize-none"
                placeholder="Describe the issue in detail. How long has it been there? What danger does it pose? Include any relevant context..."
                value={form.description} onChange={handleChange} />
              <p className="text-xs text-slate-600 mt-1">{form.description.length}/2000 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button type="button" key={c.value}
                    onClick={() => setForm(prev => ({ ...prev, category: c.value }))}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 border text-left ${
                      form.category === c.value
                        ? 'bg-primary-600/20 border-primary-500/40 text-primary-300'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Severity</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SEVERITIES.map(s => (
                  <button type="button" key={s.value}
                    onClick={() => setForm(prev => ({ ...prev, severity: s.value }))}
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 border text-center ${
                      form.severity === s.value
                        ? s.color
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Department (Optional)</label>
              <input type="text" name="department"
                className="input-field" placeholder="e.g. Roads, Water, Electricity, Sanitation"
                value={form.department} onChange={handleChange} />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Priority (Optional)</label>
              <select name="priority" className="input-field" value={form.priority} onChange={handleChange}>
                <option value="">Select Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tags (Optional)</label>
              <input type="text" name="tags"
                className="input-field" placeholder="e.g. pothole, road-damage, safety"
                value={form.tags} onChange={handleChange} />
              <p className="text-xs text-slate-600 mt-1">Comma-separated tags</p>
            </div>
          </div>

          {/* Location */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Location</h2>
              <button type="button" onClick={useCurrentLocation}
                className="btn-secondary text-sm py-2 px-3 flex items-center gap-1">
                <MapPin size={15} /> Use GPS
              </button>
            </div>
            <input type="text" name="address"
              className="input-field" placeholder="Address or landmark (e.g. Near KFC, MG Road, Bengaluru)"
              value={form.address} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Latitude</label>
                <input type="number" name="latitude" step="any"
                  className="input-field text-sm py-2" placeholder="12.9716"
                  value={form.latitude} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Longitude</label>
                <input type="number" name="longitude" step="any"
                  className="input-field text-sm py-2" placeholder="77.5946"
                  value={form.longitude} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Photo Evidence */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Photo Evidence</h2>

            {isCameraOpen ? (
              <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-[3/4] sm:aspect-video flex items-center justify-center border border-white/10">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <button type="button" onClick={stopCamera}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10">
                  <X size={14} />
                </button>
                <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
                  <button type="button" onClick={capturePhoto}
                    className="w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-md border-4 border-white rounded-full flex items-center justify-center transition-all shadow-lg">
                  </button>
                </div>
              </div>
            ) : imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10 max-w-md mx-auto bg-slate-900/50">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover block" />
                <button type="button" onClick={() => { setImagePreview(''); setImageFile(null); setForm(p => ({ ...p, imageUrl: '' })); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/65 hover:bg-red-500/80 rounded-full flex items-center justify-center text-white transition-colors z-10 animate-fade-in">
                  <X size={14} />
                </button>
                {!form.imageUrl && (
                  <div className="absolute bottom-2 inset-x-2">
                    <button type="button" onClick={handleUploadImage} disabled={uploadingImage}
                      className="btn-primary w-full py-2 text-sm rounded-xl">
                      {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </button>
                  </div>
                )}
                {form.imageUrl && (
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-lg">
                    <CheckCircle size={12} /> Uploaded
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center h-32 sm:h-40 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 transition-all duration-300 group">
                  <ImagePlus size={24} className="text-slate-600 group-hover:text-primary-400 transition-colors mb-2" />
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300">Upload Image</span>
                  <span className="text-xs text-slate-600 mt-1">Max 10 MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                
                <button type="button" onClick={startCamera}
                  className="flex flex-col items-center justify-center h-32 sm:h-40 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 transition-all duration-300 group">
                  <Camera size={24} className="text-slate-600 group-hover:text-primary-400 transition-colors mb-2" />
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300">Take Photo</span>
                  <span className="text-xs text-slate-600 mt-1">Use Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Analysis (inline — for manual flow users) */}
          {!aiPopulated && (
            <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <BrainCircuit size={15} className="text-purple-400" /> Gemini AI Analysis
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">Get AI-powered classification before submitting</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    if (!form.title.trim() || !form.description.trim()) {
                      toast.error("Please fill in Title and Description first!");
                      return;
                    }
                    handleAnalyze();
                  }} 
                  disabled={analyzing}
                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 hover:bg-slate-700 transition-colors"
                >
                  {analyzing ? (
                    <><Loader2 size={15} className="animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles size={15} className="text-purple-400" /> Analyze with AI</>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {aiResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                    className={`rounded-xl border p-5 space-y-3 ${SEVERITY_COLORS[aiResult.severity] || 'border-slate-700 bg-slate-800/50'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit size={16} />
                      <span className="text-sm font-bold">AI Analysis Result</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs font-semibold opacity-60 uppercase tracking-wider block mb-0.5">Category</span>
                        <span className="font-semibold">{aiResult.category?.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold opacity-60 uppercase tracking-wider block mb-0.5">Severity</span>
                        <span className="font-semibold">{aiResult.severity}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-semibold opacity-60 uppercase tracking-wider block mb-0.5">Department</span>
                        <span className="font-semibold">{aiResult.department}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold opacity-60 uppercase tracking-wider block mb-0.5">Trust Score</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-current transition-all duration-500"
                                 style={{ width: `${aiResult.trustScore}%` }} />
                          </div>
                          <span className="text-sm font-bold">{aiResult.trustScore}/100</span>
                        </div>
                      </div>
                    </div>

                    {aiResult.summary && (
                      <p className="text-sm opacity-80 pt-2 border-t border-current border-opacity-20">
                        {aiResult.summary}
                      </p>
                    )}
                    {aiResult.recommendedAction && (
                      <p className="text-xs opacity-60 italic">{aiResult.recommendedAction}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link to="/issues" className="btn-secondary flex-1 py-3 text-center">
              Cancel
            </Link>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportIssue;

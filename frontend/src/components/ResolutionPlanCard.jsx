import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Clock, DollarSign, Users, Wrench, Package, 
  ShieldAlert, ListOrdered, CheckCircle2, AlertTriangle, 
  RefreshCw, Copy, Printer, FileText, Loader2, Check
} from 'lucide-react';
import api from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/helpers';
import './ResolutionPlanCard.css';

const ResolutionPlanCard = ({ issueId }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPlan = async (isRegenerate = false) => {
    if (isRegenerate) setRegenerating(true);
    else setLoading(true);

    try {
      const endpoint = isRegenerate 
        ? `/ai/resolution-plan/${issueId}/regenerate`
        : `/ai/resolution-plan/${issueId}`;
        
      const res = isRegenerate ? await api.post(endpoint) : await api.get(endpoint);
      setPlan(res.data);
      if (isRegenerate) toast.success('Plan regenerated successfully');
    } catch (err) {
      toast.error('Failed to load AI Resolution Plan: ' + getErrorMessage(err));
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (issueId) {
      fetchPlan();
    }
  }, [issueId]);

  const handleCopy = () => {
    if (!plan) return;
    const text = `
Issue Resolution Plan (AI Generated)
-----------------------------------
Department: ${plan.department}
Priority: ${plan.priority}
Est. Time: ${plan.estimatedTime}
Est. Cost: ${plan.estimatedCost}
Workers: ${plan.workers}

Equipment:
${plan.equipment?.map(i => '- ' + i).join('\n')}

Materials:
${plan.materials?.map(i => '- ' + i).join('\n')}

Safety Measures:
${plan.safety?.map(i => '- ' + i).join('\n')}

Steps:
${plan.steps?.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

Citizen Impact: ${plan.citizenImpact}
Confidence: ${plan.confidence}%
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 border border-white/5 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
        <p className="text-slate-300 font-medium">Generating AI Resolution Plan...</p>
        <p className="text-slate-500 text-sm mt-2 text-center max-w-sm">
          Analyzing issue severity, location, and department protocols to build a comprehensive action plan.
        </p>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="resolution-plan-card glass rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Resolution Planner</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-green-400" />
                {plan.confidence}% Confidence
              </span>
              <span>•</span>
              <span className="italic">{plan.reasoning}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button 
            onClick={handleCopy}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-colors"
            title="Copy Plan"
          >
            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
          </button>
          <button 
            onClick={handlePrint}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-colors"
            title="Export as PDF"
          >
            <Printer size={18} />
          </button>
          <button 
            onClick={() => fetchPlan(true)}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition-colors border border-indigo-500/30"
          >
            <RefreshCw size={16} className={regenerating ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatBox icon={<Building2 size={18}/>} label="Department" value={plan.department} />
          <StatBox 
            icon={<AlertTriangle size={18}/>} 
            label="Priority" 
            value={plan.priority} 
            color={plan.priority === 'URGENT' || plan.priority === 'CRITICAL' ? 'text-red-400' : plan.priority === 'HIGH' ? 'text-orange-400' : 'text-blue-400'} 
          />
          <StatBox icon={<Clock size={18}/>} label="Est. Time" value={plan.estimatedTime} />
          <StatBox icon={<DollarSign size={18}/>} label="Est. Cost" value={plan.estimatedCost} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Requirements & Safety */}
          <div className="space-y-6">
            <ListSection icon={<Users size={18}/>} title="Manpower" items={[plan.workers]} />
            <ListSection icon={<Wrench size={18}/>} title="Equipment" items={plan.equipment} />
            <ListSection icon={<Package size={18}/>} title="Materials" items={plan.materials} />
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <h3 className="flex items-center gap-2 font-semibold text-red-400 mb-3">
                <ShieldAlert size={18} /> Safety Precautions
              </h3>
              <ul className="space-y-2">
                {plan.safety?.map((item, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-red-400/50 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <h3 className="font-semibold text-orange-400 mb-2 text-sm">Citizen Impact</h3>
              <p className="text-sm text-slate-300">{plan.citizenImpact}</p>
            </div>
          </div>

          {/* Right Column: Step-by-step Timeline */}
          <div className="lg:col-span-2">
            <h3 className="flex items-center gap-2 font-semibold text-white mb-6 text-lg">
              <ListOrdered size={20} className="text-indigo-400" /> Resolution Steps
            </h3>
            
            <div className="relative border-l border-indigo-500/30 ml-3 space-y-6">
              {plan.steps?.map((step, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-400">
                    {idx + 1}
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/60 transition-colors">
                    <p className="text-slate-200">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon, label, value, color = "text-indigo-400" }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
    <div className="flex items-center gap-2 text-slate-400 mb-2 text-sm font-medium">
      {icon} {label}
    </div>
    <div className={`font-semibold text-base sm:text-lg ${color}`}>{value}</div>
  </div>
);

const ListSection = ({ icon, title, items }) => (
  <div>
    <h3 className="flex items-center gap-2 font-semibold text-slate-200 mb-3">
      <span className="text-indigo-400">{icon}</span> {title}
    </h3>
    <ul className="space-y-2">
      {items?.map((item, i) => (
        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
          <span className="text-indigo-500/50 mt-1">•</span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default ResolutionPlanCard;

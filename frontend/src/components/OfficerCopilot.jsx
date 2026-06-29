import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, BarChart2, ListOrdered, Send, Loader2, Sparkles, 
  Activity, AlertTriangle, Clock, Briefcase, ChevronRight, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axiosConfig';
import { getSeverityBadgeClass, getStatusBadgeClass } from '../utils/helpers';
import './OfficerCopilot.css';

const SUGGESTED_PROMPTS = [
  "Show today's highest priority complaints",
  "Which issues require immediate attention?",
  "Which department has the highest workload?",
  "Which complaints are overdue?",
  "Summarize unresolved complaints",
  "Which areas are most affected?",
  "Suggest the best order to resolve today's issues"
];

const ICON_MAP = {
  'activity': Activity,
  'alert': AlertTriangle,
  'clock': Clock,
  'briefcase': Briefcase
};

export default function OfficerCopilot() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('insights'); // insights, priorities, chat
  
  // Data states
  const [insights, setInsights] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingPriorities, setLoadingPriorities] = useState(false);
  
  // Chat states
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: "Hello Officer. I'm your AI Copilot. I can analyze live issue data and help you prioritize your workload. What would you like to know?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch Insights
  const fetchInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const res = await api.get('/copilot/insights');
      setInsights(res.data);
    } catch (err) {
      toast.error('Failed to load AI insights');
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  // Fetch Priorities
  const fetchPriorities = useCallback(async () => {
    setLoadingPriorities(true);
    try {
      const res = await api.get('/copilot/priorities');
      setPriorities(res.data);
    } catch (err) {
      toast.error('Failed to load priority ranking');
    } finally {
      setLoadingPriorities(false);
    }
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchInsights]);

  // Fetch priorities only when tab is selected and we don't have them yet
  const hasFetchedPriorities = useRef(false);
  useEffect(() => {
    if (activeTab === 'priorities' && priorities.length === 0 && !hasFetchedPriorities.current) {
      hasFetchedPriorities.current = true;
      fetchPriorities();
    }
  }, [activeTab, priorities.length, fetchPriorities]);

  // Chat scroll
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, activeTab]);

  // Handle Chat Send
  const handleChatSubmit = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    const text = overrideText || chatInput;
    if (!text.trim() || isTyping) return;

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: text.trim() }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/copilot/ask', { message: text.trim() });
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: res.data.reply,
        fallback: res.data.fallback 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: "I'm having trouble accessing the data right now. Please try again later." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Render Insight Card
  const renderInsightCard = (insight, idx) => {
    const Icon = ICON_MAP[insight.icon] || Sparkles;
    return (
      <motion.div 
        key={idx} 
        className="copilot-insight-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg bg-opacity-20 ${insight.color.replace('text-', 'bg-')}`}>
            <Icon size={18} className={insight.color} />
          </div>
          <h4 className="font-semibold text-slate-300 text-sm">{insight.title}</h4>
        </div>
        <div className="text-2xl font-bold text-white mb-1">{insight.value}</div>
        <div className="text-xs text-slate-400">{insight.trend}</div>
      </motion.div>
    );
  };

  // Render Priority Card
  const renderPriorityCard = (issue, idx) => {
    return (
      <motion.div 
        key={issue.issueId} 
        className="copilot-priority-card"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.1 }}
      >
        <div className="copilot-priority-rank">#{issue.priorityRank}</div>
        <div className="flex flex-col gap-2 pr-10">
          <h4 className="font-bold text-white text-base leading-tight">{issue.title}</h4>
          
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-md ${getSeverityBadgeClass(issue.severity)}`}>
              {issue.severity}
            </span>
            <span className={`px-2 py-0.5 rounded-md ${getStatusBadgeClass(issue.status)}`}>
              {issue.status}
            </span>
            <span className="text-slate-400 mt-0.5">{issue.ageInDays} days old</span>
          </div>

          <div className="mt-2 text-sm text-indigo-300 italic flex items-start gap-2 bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20">
            <Sparkles size={14} className="mt-0.5 shrink-0" />
            <p>{issue.reasoning}</p>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="w-1/2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full" 
                style={{ width: `${issue.priorityScore}%` }}
              />
            </div>
            <button 
              onClick={() => navigate(`/issues/${issue.issueId}`)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Eye size={14} /> View Details
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="copilot-panel">
      {/* Header */}
      <div className="copilot-header">
        <div className="flex items-center gap-3">
          <div className="copilot-header-icon">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Officer AI Copilot
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                BETA
              </span>
            </h2>
            <p className="text-xs text-slate-400">Intelligent workload management and insights</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="copilot-tabs">
        <button 
          className={`copilot-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <BarChart2 size={16} /> Live Insights
        </button>
        <button 
          className={`copilot-tab-btn ${activeTab === 'priorities' ? 'active' : ''}`}
          onClick={() => setActiveTab('priorities')}
        >
          <ListOrdered size={16} /> AI Priorities
        </button>
        <button 
          className={`copilot-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <Bot size={16} /> Ask Copilot
        </button>
      </div>

      {/* Content */}
      <div className="copilot-content">
        <AnimatePresence mode="wait">
          {/* INSIGHTS TAB */}
          {activeTab === 'insights' && (
            <motion.div 
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              {loadingInsights ? (
                <div className="copilot-loading-overlay">
                  <Loader2 size={32} className="animate-spin text-indigo-500" />
                  <span>Analyzing database...</span>
                </div>
              ) : (
                <div className="copilot-insights-grid">
                  {insights.map((insight, idx) => renderInsightCard(insight, idx))}
                </div>
              )}
            </motion.div>
          )}

          {/* PRIORITIES TAB */}
          {activeTab === 'priorities' && (
            <motion.div 
              key="priorities"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {loadingPriorities ? (
                <div className="copilot-loading-overlay">
                  <Loader2 size={32} className="animate-spin text-indigo-500" />
                  <span>AI is ranking active issues...</span>
                </div>
              ) : priorities.length === 0 ? (
                <div className="text-center text-slate-400 py-10">No active issues to prioritize.</div>
              ) : (
                <div className="copilot-priority-list">
                  {priorities.map((issue, idx) => renderPriorityCard(issue, idx))}
                </div>
              )}
            </motion.div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="copilot-chat-container"
            >
              <div className="copilot-chat-messages">
                {messages.length === 1 && (
                  <div className="copilot-suggestions">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                      <button 
                        key={idx} 
                        className="copilot-prompt-chip"
                        onClick={() => handleChatSubmit(null, prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
                
                {messages.map(msg => (
                  <div key={msg.id} className={msg.role === 'ai' ? 'copilot-bubble-ai' : 'copilot-bubble-user'}>
                    {/* Render newlines for AI responses */}
                    {msg.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i !== msg.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                ))}

                {isTyping && (
                  <div className="copilot-bubble-ai flex gap-1 items-center px-4 py-3">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="copilot-chat-input-area">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about issues, departments, or priorities..."
                  disabled={isTyping}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim() || isTyping}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 flex items-center justify-center disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

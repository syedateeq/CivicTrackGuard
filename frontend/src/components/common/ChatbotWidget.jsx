import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Loader2, Bot, User,
  Sparkles, ChevronDown, RotateCcw
} from 'lucide-react';
import api from '../../api/axiosConfig';

// ── Quick-prompt suggestion chips shown on first open ─────────────────────
const SUGGESTIONS = [
  '💡 How do I report an issue?',
  '📊 What do issue statuses mean?',
  '🏆 How does the leaderboard work?',
  '📍 How do I use the map?',
  '🔔 How do notifications work?',
];

// ── Typing indicator (animated dots) ──────────────────────────────────────
const TypingDots = () => (
  <div className="flex items-end gap-1 px-4 py-3">
    {[0, 1, 2].map(i => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-purple-400"
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
      />
    ))}
  </div>
);

// ── Single chat bubble ─────────────────────────────────────────────────────
const Bubble = ({ msg }) => {
  const isBot = msg.role === 'bot';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
        ${isBot
          ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
          : 'bg-slate-700 text-slate-300'
        }`}>
        {isBot ? <Bot size={14} /> : <User size={13} />}
      </div>

      {/* Text */}
      <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
        ${isBot
          ? 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5'
          : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-none'
        }`}>
        {msg.text}
      </div>
    </motion.div>
  );
};

// ── Main widget ───────────────────────────────────────────────────────────
const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'bot',
      text: "👋 Hi! I'm **CivicBot**, your assistant for CivicTrackGuard.\n\nI can help you report issues, understand statuses, navigate the platform, and more. What can I help you with?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text?.trim() || input.trim();
    if (!trimmed || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/ask', { message: trimmed });
      const reply = res.data?.reply || "I'm not sure how to answer that. Try asking something else!";
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', text: "⚠️ Something went wrong. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, open]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'bot',
      text: "👋 Chat cleared! I'm ready to help again. What would you like to know?"
    }]);
  };

  const showSuggestions = messages.length <= 1;

  return (
    <>
      {/* ── Chat Panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] max-w-[420px]
                       flex flex-col rounded-2xl overflow-hidden
                       border border-white/10 shadow-2xl shadow-black/60"
            style={{
              background: 'linear-gradient(160deg, rgba(15,23,42,0.97) 0%, rgba(23,18,52,0.97) 100%)',
              backdropFilter: 'blur(24px)',
              maxHeight: '72vh'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/8
                            bg-gradient-to-r from-purple-600/20 to-blue-600/15">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600
                                flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    CivicBot
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                                     bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">Powered by Gemini AI</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  title="Clear chat"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[200px]"
                 style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600
                                  flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-slate-800/80 border border-white/5 rounded-2xl rounded-tl-none">
                    <TypingDots />
                  </div>
                </motion.div>
              )}

              {/* Suggestion chips */}
              {showSuggestions && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-2 pt-1"
                >
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 rounded-xl
                                 bg-slate-800/70 border border-white/8 text-slate-300
                                 hover:border-purple-500/50 hover:text-white hover:bg-purple-500/10
                                 transition-all duration-150 text-left"
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/8 bg-slate-900/40">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask CivicBot anything…"
                  disabled={loading}
                  className="flex-1 resize-none bg-slate-800/60 border border-white/8 rounded-xl
                             px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500
                             focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20
                             disabled:opacity-50 transition-all duration-200 max-h-28 overflow-y-auto"
                  style={{ scrollbarWidth: 'thin' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                             bg-gradient-to-br from-purple-600 to-blue-600
                             text-white shadow-lg shadow-purple-600/30
                             hover:from-purple-500 hover:to-blue-500
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-600 mt-2">
                CivicBot can make mistakes — verify important info.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Trigger Button ──────────────────────────────── */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.6 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Open CivicBot chat"
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-2xl
                   flex items-center justify-center
                   shadow-2xl shadow-purple-600/40
                   transition-all duration-300"
        style={{
          background: open
            ? 'linear-gradient(135deg, #7c3aed, #2563eb)'
            : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          boxShadow: '0 8px 32px rgba(124,58,237,0.45), 0 0 0 1px rgba(255,255,255,0.1)'
        }}
      >
        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-2xl animate-ping opacity-25
                           bg-purple-500 pointer-events-none" />
        )}

        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle size={22} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {!open && unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                         bg-red-500 border-2 border-slate-950
                         flex items-center justify-center text-[10px] font-bold text-white"
            >
              {unread}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Gemini sparkle */}
        <motion.span
          className="absolute -top-1 -left-1 text-yellow-300"
          animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        >
          <Sparkles size={12} />
        </motion.span>
      </motion.button>
    </>
  );
};

export default ChatbotWidget;

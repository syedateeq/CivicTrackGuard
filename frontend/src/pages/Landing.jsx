import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, Zap, BarChart3, Users, MapPin, BrainCircuit, 
  ArrowRight, AlertTriangle, CheckCircle, Clock, Star
} from 'lucide-react';

const FEATURES = [
  {
    icon: BrainCircuit,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    title: 'Gemini AI Analysis',
    desc: 'Our AI analyzes every report in real time — classifying the issue, predicting severity, and routing it to the right department automatically.'
  },
  {
    icon: MapPin,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Hyperlocal Mapping',
    desc: 'Visualize civic problems on an interactive map. Filter by area, category, or severity to see what matters most in your neighborhood.'
  },
  {
    icon: BarChart3,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Transparent Tracking',
    desc: 'Every issue has a public status timeline. Citizens watch reports go from PENDING to RESOLVED — no more black holes in civic reporting.'
  },
  {
    icon: Users,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'Community Gamification',
    desc: 'Earn points for reporting, upvoting, and engaging. Compete on the leaderboard and get recognized as a Community Hero in your city.'
  },
];

const STATS = [
  { label: 'Issues Resolved', value: '2,400+', icon: CheckCircle, color: 'text-emerald-400' },
  { label: 'Active Citizens', value: '8,900+', icon: Users, color: 'text-blue-400' },
  { label: 'Cities Covered', value: '15+',    icon: MapPin,       color: 'text-purple-400' },
  { label: 'Avg Resolution',  value: '4.2 days', icon: Clock,     color: 'text-amber-400' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Report',  desc: 'Snap a photo and describe the issue. Our AI instantly classifies it.' },
  { step: '02', title: 'Analyze', desc: 'Gemini AI predicts severity, department, and generates a trust score.' },
  { step: '03', title: 'Track',   desc: 'Follow real-time status updates as the right department takes action.' },
  { step: '04', title: 'Reward',  desc: 'Earn points, badges, and recognition for your civic contributions.' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-24 flex items-center justify-center overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20"
               style={{ background: 'radial-gradient(ellipse, #2563eb 0%, transparent 70%)' }} />
          <div className="absolute top-40 left-1/4 w-64 h-64 rounded-full opacity-10"
               style={{ background: 'radial-gradient(ellipse, #7c3aed 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8">
              <BrainCircuit size={16} className="text-primary-400" />
              <span className="text-sm font-medium text-slate-300">Powered by Google Gemini AI</span>
              <Star size={12} className="text-amber-400 fill-amber-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.08] tracking-tight mb-6"
          >
            Your City's Problems.
            <br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI-Powered Solutions.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10"
          >
            CivicTrackGuard connects citizens with local authorities through AI-powered issue reporting.
            Report potholes, garbage dumps, water leaks, and broken infrastructure — 
            and watch your community transform in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="btn-primary text-base px-8 py-3.5 rounded-2xl w-full sm:w-auto">
              Start Reporting Free <ArrowRight size={18} />
            </Link>
            <Link to="/issues" className="btn-secondary text-base px-8 py-3.5 rounded-2xl w-full sm:w-auto">
              View Public Issues
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} variants={itemVariants}
                  className="glass rounded-2xl p-6 text-center border border-white/5">
                  <Icon size={24} className={`${stat.color} mx-auto mb-3`} />
                  <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-4">Everything You Need</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            From AI-powered classification to gamified community engagement — 
            CivicTrackGuard is the complete civic platform.
          </p>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} variants={itemVariants}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 cursor-default group">
                <div className={`w-12 h-12 rounded-xl border ${f.bg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={22} className={f.color} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">How It Works</h2>
            <p className="text-slate-400">Four simple steps from problem to resolution.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="text-5xl font-black mb-4"
                     style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="glass rounded-3xl p-12 border border-white/8 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 70%)' }} />
            <div className="relative z-10">
              <AlertTriangle size={40} className="text-amber-400 mx-auto mb-6" />
              <h2 className="text-4xl font-black text-white mb-4">
                See Something? Report It.
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Every report you submit makes your neighborhood safer and cleaner.
                Join thousands of citizens driving real change.
              </p>
              <Link to="/register" className="btn-primary text-base px-10 py-4 rounded-2xl">
                Get Started — It's Free <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              <Shield size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-400">CivicTrackGuard</span>
          </div>
          <p className="text-xs text-slate-600">Built for the Vibe2Ship Hackathon · Community Hero Challenge</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

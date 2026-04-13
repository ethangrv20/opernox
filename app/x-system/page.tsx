'use client';
import { motion } from 'framer-motion';
import { Twitter, Zap, Clock, CheckCircle2, FileText } from 'lucide-react';

export default function XSystemPage() {
  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">X System</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Twitter automation + queue</div>
      </div>
      <div className="page-content">
        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { icon: <CheckCircle2 size={15} />, val: '—', label: 'Posts Today', color: 'var(--green)' },
            { icon: <FileText size={15} />, val: '—', label: 'Queue Pending', color: 'var(--cyan)' },
            { icon: <CheckCircle2 size={15} />, val: '—', label: 'LM Approved', color: 'var(--violet)' },
            { icon: <Zap size={15} />, val: '—', label: 'Auto-Post', color: 'var(--amber)' },
            { icon: <Twitter size={15} />, val: '—', label: 'API Status', color: 'var(--text-2)' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-1px' }}>{s.val}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { title: 'Recent Posts', badge: 'History', icon: '🐦' },
            { title: "Today's Queue", badge: 'Pending', icon: '📋' },
            { title: 'Lead Magnets', badge: 'Available', icon: '🧲' },
            { title: 'Research Agent', badge: 'Scheduled', icon: '🔍' },
          ].map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="card">
              <div className="card-header">
                <div className="card-title"><span style={{ fontSize: '14px' }}>{card.icon}</span> {card.title}</div>
                <span className="badge badge-n">{card.badge}</span>
              </div>
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>Connect to your Mission Control server to see live data.</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

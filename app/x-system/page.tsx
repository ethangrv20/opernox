'use client';
import { motion } from 'framer-motion';
import { Twitter, Zap, Clock, CheckCircle2, FileText } from 'lucide-react';

const ACCENT = '#06b6d4';

export default function XSystemPage() {
  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">X System</div>
      </div>
      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Twitter Automation</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Post scheduling, queue management &amp; lead magnets</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { icon: <CheckCircle2 size={14} />, val: '—', label: 'Posts Today' },
            { icon: <FileText size={14} />, val: '—', label: 'Queue Pending' },
            { icon: <CheckCircle2 size={14} />, val: '—', label: 'LM Approved' },
            { icon: <Zap size={14} />, val: '—', label: 'Auto-Post' },
            { icon: <Twitter size={14} />, val: '—', label: 'API Status' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '13px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <div style={{ color: ACCENT }}>{s.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-1px' }}>{s.val}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Recent Posts', sub: 'History' },
            { title: "Today's Queue", sub: 'Pending' },
          ].map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{card.title}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{card.sub}</div>
              </div>
              <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>Connect to Mission Control to see live data</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';
import { motion } from 'framer-motion';
import { Music, Video, Clock, CheckCircle2 } from 'lucide-react';

export default function TikTokPage() {
  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">TikTok</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Short-form video uploads</div>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { icon: <Video size={15} />, val: '—', label: 'Videos Posted', color: '#ff0050' },
            { icon: <CheckCircle2 size={15} />, val: '—', label: 'Posted Today', color: '#ff0050' },
            { icon: <Clock size={15} />, val: '—', label: 'Queue', color: '#ff0050' },
            { icon: <Music size={15} />, val: '—', label: 'Sounds Used', color: '#ff0050' },
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="card-header">
            <div className="card-title">Upload Queue</div>
            <span className="badge badge-n">—</span>
          </div>
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>Connect to your Mission Control server to see live data.</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

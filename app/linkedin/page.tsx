'use client';
import { motion } from 'framer-motion';
import { Linkedin, FileText, Users, MessageSquare, TrendingUp } from 'lucide-react';

export default function LinkedInPage() {
  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">LinkedIn</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Content + article publishing</div>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { icon: <FileText size={15} />, val: '—', label: 'Posts Published', color: '#0A66C2' },
            { icon: <Users size={15} />, val: '—', label: 'Followers', color: '#0A66C2' },
            { icon: <MessageSquare size={15} />, val: '—', label: 'Comments', color: '#0A66C2' },
            { icon: <TrendingUp size={15} />, val: '—', label: 'Impressions', color: '#0A66C2' },
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
            <div className="card-title"><Linkedin size={14} /> Recent Posts</div>
            <span className="badge badge-n">History</span>
          </div>
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>Connect to your Mission Control server to see live data.</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

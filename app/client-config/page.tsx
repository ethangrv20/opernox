'use client';
import { motion } from 'framer-motion';
import { Settings, User, Key, Globe } from 'lucide-react';

export default function ClientConfigPage() {
  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Client Config</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>System-wide settings</div>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {[
            { icon: <User size={18} />, title: 'Profile Settings', desc: 'Name, timezone, preferences' },
            { icon: <Key size={18} />, title: 'API Keys', desc: 'HeyGen, Twitter, AdsPower, OpenAI' },
            { icon: <Globe size={18} />, title: 'Proxy Config', desc: 'Proxy rotation + warmup settings' },
            { icon: <Settings size={18} />, title: 'Automation Rules', desc: 'Posting schedules, limits, behavior' },
          ].map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="card" style={{ padding: '22px' }}>
              <div style={{ color: 'var(--violet)', marginBottom: 12 }}>{card.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 4 }}>{card.title}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-3)' }}>{card.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

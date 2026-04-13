'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Users, TrendingUp, Plug, Plus } from 'lucide-react';

const ACCENT = '#ec4899';

export default function OutreachPage() {
  const [tab, setTab] = useState<'campaigns' | 'leads' | 'analytics'>('campaigns');

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">IG Outreach</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-3)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>Not connected</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit' }}>
            <Plug size={12} /> Connect
          </button>
        </div>
      </div>

      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Mass DM + AI Replies</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Automated Instagram outreach with intelligent response handling</div>
        </motion.div>

        {/* Empty state */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 32px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Send size={20} style={{ color: ACCENT }} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: 6 }}>Connect your Instagram accounts</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.65 }}>
            Link your IG accounts to run outreach campaigns, manage leads, and handle AI-powered replies at scale.
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
            <Plug size={13} /> Connect Instagram
          </button>
        </motion.div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14, opacity: 0.6 }}>
          {[
            { icon: <Send size={13} />, val: '—', label: 'DMs Sent', sub: 'All time' },
            { icon: <MessageSquare size={13} />, val: '—', label: 'Replies', sub: 'Received' },
            { icon: <TrendingUp size={13} />, val: '—', label: 'Escalated', sub: 'To human' },
            { icon: <Users size={13} />, val: '—', label: 'Campaigns', sub: 'Active' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <div style={{ color: ACCENT }}>{s.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>{s.val}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-4)', marginTop: 1 }}>{s.sub}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '0 4px', borderBottom: '1px solid var(--border)', display: 'flex' }}>
                {(['campaigns', 'leads', 'analytics'] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: '12px 18px', fontSize: '12px', fontWeight: 600,
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    color: tab === t ? 'var(--text)' : 'var(--text-3)',
                    background: 'transparent', borderBottom: `2px solid ${tab === t ? ACCENT : 'transparent'}`, transition: 'all 0.15s',
                  }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>No data yet</div>
                <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Your outreach data will appear here once connected</div>
              </div>
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* AI Reply Settings — disabled */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', opacity: 0.6 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>AI Reply Engine</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {[
                  { label: 'Auto-reply to DMs', sub: 'Requires connection' },
                  { label: 'Escalate on intent', sub: 'Requires connection' },
                  { label: 'Learning mode', sub: 'Requires connection' },
                ].map((s, i) => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: i < 2 ? 10 : 0 }}>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>{s.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{s.sub}</div>
                    </div>
                    <div style={{ width: 36, height: 20, borderRadius: 99, background: 'var(--surface-3)', position: 'relative', cursor: 'not-allowed' }}>
                      <div style={{ position: 'absolute', left: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'var(--text-3)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* DM Templates — empty */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>DM Templates</div>
              </div>
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No templates yet</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Play, Square, ChevronRight, Clock, CheckCircle2, User } from 'lucide-react';

const ACCENT = '#10b981';

export default function UGCPage() {
  const [scenario, setScenario] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const scenarios = [
    { id: 'A', title: 'Scenario A', sub: 'Same video posted to all accounts' },
    { id: 'B', title: 'Scenario B', sub: 'Different video per account' },
  ];

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">UGC System</div>
      </div>

      <div className="page-content">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>HeyGen + Instagram</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Automated video generation and posting pipeline</div>
        </motion.div>

        {/* Scenario + Control */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '22px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Select Scenario</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {scenarios.map((s) => (
              <div key={s.id}
                onClick={() => setScenario(s.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${scenario === s.id ? ACCENT : 'var(--border-2)'}`,
                  background: scenario === s.id ? 'rgba(16,185,129,0.06)' : 'var(--surface-2)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: scenario === s.id ? ACCENT : 'var(--text)', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: running ? ACCENT : 'var(--text-3)', boxShadow: running ? `0 0 8px ${ACCENT}` : 'none' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{running ? 'Run active' : 'Idle'}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{running ? 'Processing accounts' : 'No active run'}</div>
            </div>
            {running && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 120, height: 3, background: 'var(--surface-3)', borderRadius: 99 }}>
                  <div style={{ width: '34%', height: '100%', background: ACCENT, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>34%</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setRunning(true)} disabled={!scenario || running} className="btn btn-primary" style={{ flex: 1 }}>
              <Play size={13} /> Start Run
            </button>
            <button onClick={() => setRunning(false)} disabled={!running} className="btn btn-danger" style={{ padding: '8px 14px' }}>
              <Square size={13} />
            </button>
          </div>
        </motion.div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { icon: <User size={14} />, val: '—', label: 'IG Profiles' },
            { icon: <Video size={14} />, val: '—', label: 'Videos Generated' },
            { icon: <CheckCircle2 size={14} />, val: '—', label: 'Posted' },
            { icon: <Clock size={14} />, val: '—', label: 'Elapsed' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ color: ACCENT }}>{s.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-1px' }}>{s.val}</div>
            </motion.div>
          ))}
        </div>

        {/* Live feed + queue */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Live Feed</div>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: running ? ACCENT : 'var(--text-3)' }} />
            </div>
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-3)', fontSize: '13px', marginBottom: 6 }}>No run in progress</div>
              <div style={{ color: 'var(--text-3)', fontSize: '11.5px' }}>Start a run to see live activity</div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Account Queue</div>
            </div>
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-3)', fontSize: '12.5px' }}>No accounts loaded</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

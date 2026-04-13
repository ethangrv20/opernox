'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Play, Square, User, Clock, CheckCircle2 } from 'lucide-react';

export default function UGCPage() {
  const [scenario, setScenario] = useState<'A' | 'B' | null>(null);
  const [running, setRunning] = useState(false);

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">UGC System</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>HeyGen + Instagram automation</div>
      </div>

      <div className="page-content">
        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          {/* Scenario selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Scenario</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'A', label: 'A — Same Video All Accounts' },
                { id: 'B', label: 'B — Different Video Per Account' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScenario(s.id as 'A' | 'B')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `1px solid ${scenario === s.id ? 'var(--green)' : 'var(--border-2)'}`,
                    background: scenario === s.id ? 'rgba(52,211,153,0.1)' : 'var(--surface-2)',
                    color: scenario === s.id ? 'var(--green)' : 'var(--text-2)',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: 'var(--border)' }} />

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              background: running ? 'var(--green)' : 'var(--text-3)',
              boxShadow: running ? '0 0 8px var(--green)' : 'none',
              transition: 'all 0.2s',
            }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{running ? 'Running' : 'Idle'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{running ? 'Run in progress' : 'No run active'}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button
              onClick={() => setRunning(true)}
              disabled={!scenario || running}
              className="btn btn-primary btn-sm"
            >
              <Play size={12} /> Start Run
            </button>
            <button
              onClick={() => setRunning(false)}
              disabled={!running}
              className="btn btn-danger btn-sm"
            >
              <Square size={12} /> Stop
            </button>
          </div>
        </motion.div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { icon: <User size={16} />, val: '—', label: 'IG Profiles', color: 'var(--green)' },
            { icon: <Video size={16} />, val: '—', label: 'Videos Generated', color: 'var(--violet)' },
            { icon: <CheckCircle2 size={16} />, val: '—', label: 'Posted This Run', color: 'var(--cyan)' },
            { icon: <Clock size={16} />, val: '—', label: 'Elapsed', color: 'var(--amber)' },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
              style={{ padding: '16px 18px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text)' }}>{s.val}</div>
            </motion.div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
          {/* Live Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="card-header">
              <div className="card-title">Live Status</div>
              <span className="badge badge-n">Idle</span>
            </div>
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-3)', marginBottom: 8, fontSize: '14px' }}>No run in progress</div>
              <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Select a scenario and click Start Run.</div>
            </div>
          </motion.div>

          {/* Account Queue */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
          >
            <div className="card-header">
              <div className="card-title">Account Queue</div>
              <span className="badge badge-n">—</span>
            </div>
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>No accounts loaded.</div>
              <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: 4 }}>Start a run to see accounts here.</div>
            </div>
          </motion.div>
        </div>

        {/* Generated Videos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ marginTop: 14 }}
        >
          <div className="card-header">
            <div className="card-title">Generated Videos</div>
            <span className="badge badge-n">—</span>
          </div>
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>No videos generated yet.</div>
            <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: 4 }}>Videos will appear here after a run.</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

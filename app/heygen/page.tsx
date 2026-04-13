'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Video, Clock, Plug, Plus } from 'lucide-react';

const ACCENT = '#8b5cf6';

export default function HeyGenPage() {
  const [tab, setTab] = useState<'videos' | 'scripts' | 'templates'>('videos');

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">HeyGen</div>
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
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>AI Video Generation</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Create avatar videos from scripts, then send to IG or TikTok</div>
        </motion.div>

        {/* Empty state */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 32px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Wand2 size={20} style={{ color: ACCENT }} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: 6 }}>Connect your HeyGen account</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.65 }}>
            Link HeyGen to generate AI avatar videos from scripts and send them directly to your content pipeline.
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
            <Plug size={13} /> Connect HeyGen
          </button>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Quick create — disabled */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', opacity: 0.6 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 14 }}>Quick Create</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Script → Video', sub: 'Write or paste script' },
                  { label: 'Use Template', sub: 'Pre-built layouts' },
                  { label: 'Import Slides', sub: 'From PDF or PPT' },
                ].map((t) => (
                  <div key={t.label} style={{ padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: 'not-allowed' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-4)' }}>{t.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '0 4px', borderBottom: '1px solid var(--border)', display: 'flex' }}>
                {(['videos', 'scripts', 'templates'] as const).map((t) => (
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
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>No videos yet</div>
                <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Your generated videos will appear here once connected</div>
              </div>
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Created', val: '—', sub: 'All time' },
                { label: 'Ready', val: '—', sub: 'To use' },
                { label: 'In Queue', val: '—', sub: 'Processing' },
                { label: 'Credits', val: '—', sub: 'Available' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', opacity: 0.6 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>{s.val}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-4)', marginTop: 1 }}>{s.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Destinations — empty */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Destinations</div>
              </div>
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No destinations configured</div>
              </div>
            </motion.div>

            {/* Settings */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Settings</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>Auto-send to IG</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>After video is ready</div>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 99, background: 'var(--surface-3)', position: 'relative', cursor: 'not-allowed' }}>
                    <div style={{ position: 'absolute', left: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'var(--text-3)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>Auto-send to TikTok</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>After video is ready</div>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 99, background: 'var(--surface-3)', position: 'relative', cursor: 'not-allowed' }}>
                    <div style={{ position: 'absolute', left: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'var(--text-3)' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
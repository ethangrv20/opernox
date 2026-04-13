'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Video, Clock, CheckCircle2, Play, Trash2, Download, Loader2, Plus } from 'lucide-react';

const ACCENT = '#8b5cf6';

const MOCK_VIDEOS = [
  { id: 1, title: 'SMS Automation Benefits', script: 'The average SMS gets a 98% open rate. Email barely hits 20%...', duration: '1:24', status: 'ready' },
  { id: 2, title: 'TextAscend Platform Demo', script: 'Imagine sending 10,000 personalized messages in under 5 minutes...', duration: '2:01', status: 'ready' },
  { id: 3, title: 'Client Results - TechFlow', script: 'TechFlow scaled from 200 to 8,000 outbound messages per day...', duration: '0:58', status: 'processing' },
  { id: 4, title: 'Follow-up Sequence Example', script: 'First message: "Hey [name], quick question..."', duration: '0:45', status: 'rendering', progress: 67 },
];

export default function HeyGenPage() {
  const [tab, setTab] = useState<'videos' | 'scripts' | 'templates'>('videos');

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">HeyGen</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>Connected</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
            <Wand2 size={12} /> Create Video
          </button>
        </div>
      </div>

      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>AI Video Generation</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Create avatar videos from scripts, then send to IG or TikTok</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Quick create */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 14 }}>Quick Create</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Script → Video', sub: 'Write or paste script', icon: '✍️' },
                  { label: 'Use Template', sub: 'Pre-built layouts', icon: '📋' },
                  { label: 'Import Slides', sub: 'From PDF or PPT', icon: '📄' },
                ].map((t) => (
                  <div key={t.label} style={{ padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = `rgba(139,92,246,0.3)`; e.currentTarget.style.background = 'var(--surface-3)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; }}>
                    <div style={{ fontSize: '18px', marginBottom: 6 }}>{t.icon}</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{t.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
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

              {tab === 'videos' && (
                <div>
                  {MOCK_VIDEOS.map((vid, i) => (
                    <motion.div key={vid.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ padding: '14px 16px', borderBottom: i < MOCK_VIDEOS.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 52, height: 38, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                        {vid.status === 'processing' || vid.status === 'rendering' ? (
                          <Loader2 size={14} style={{ color: ACCENT, animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Video size={14} style={{ color: 'var(--text-3)' }} />
                        )}
                        <div style={{ position: 'absolute', bottom: 3, right: 3, fontSize: '9px', fontWeight: 700, color: 'var(--text-3)', background: 'rgba(0,0,0,0.6)', borderRadius: 3, padding: '1px 3px' }}>{vid.duration}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: 3 }}>{vid.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vid.script}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {vid.status === 'ready' && (
                          <>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(16,185,129,0.09)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.16)' }}>✓ ready</span>
                            <button style={{ width: 28, height: 28, borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)' }}>
                              <Download size={11} />
                            </button>
                          </>
                        )}
                        {vid.status === 'processing' && (
                          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(139,92,246,0.09)', color: ACCENT, border: '1px solid rgba(139,92,246,0.16)' }}>
                            <Loader2 size={9} style={{ display: 'inline', animation: 'spin 1s linear infinite', verticalAlign: 'middle', marginRight: 2 }} /> processing
                          </span>
                        )}
                        {vid.status === 'rendering' && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: ACCENT }}>{vid.progress}%</span>
                            <div style={{ width: 60, height: 3, background: 'var(--surface-3)', borderRadius: 99 }}>
                              <div style={{ width: `${vid.progress}%`, height: '100%', background: ACCENT, borderRadius: 99 }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {tab === 'scripts' && (
                <div style={{ padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Saved Scripts</div>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700, color: ACCENT, fontFamily: 'inherit' }}>
                      <Plus size={11} /> New Script
                    </button>
                  </div>
                  {[
                    { title: 'SMS opener script', words: 85, updated: '2 days ago' },
                    { title: 'Follow-up message', words: 42, updated: '4 days ago' },
                    { title: 'Value pitch script', words: 120, updated: '1 week ago' },
                  ].map((s) => (
                    <div key={s.title} style={{ padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 6, background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{s.title}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-3)', marginTop: 2 }}>{s.words} words · updated {s.updated}</div>
                      </div>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '10.5px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
                        <Wand2 size={10} /> Use
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'templates' && (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {[
                      { name: 'Professional Talk', avatar: 'Business man', duration: '1-2 min' },
                      { name: 'Casual Chat', avatar: 'Woman smiling', duration: '30s - 1m' },
                      { name: 'Tutorial Style', avatar: 'Teacher', duration: '2-5 min' },
                      { name: 'Testimonial', avatar: 'Customer', duration: '1-2 min' },
                    ].map((t) => (
                      <div key={t.name} style={{ padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = `rgba(139,92,246,0.3)`; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                        <div style={{ width: '100%', height: 50, borderRadius: 6, background: 'var(--surface-3)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-3)' }}>Preview</div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: 2 }}>{t.name}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{t.avatar} · {t.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: <Video size={13} />, val: '7', label: 'Created', sub: 'All time' },
                { icon: <CheckCircle2 size={13} />, val: '2', label: 'Ready', sub: 'To use' },
                { icon: <Clock size={13} />, val: '3', label: 'In Queue', sub: 'Processing' },
                { icon: <Wand2 size={13} />, val: '12', label: 'Templates', sub: 'Available' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <div style={{ color: ACCENT }}>{s.icon}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>{s.val}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-3)', marginTop: 1 }}>{s.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* API status */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>API Status</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600 }}>HeyGen Credits</div>
                  <div style={{ fontSize: '11px', color: 'var(--emerald)', fontWeight: 700 }}>Active</div>
                </div>
                <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 99, marginBottom: 6 }}>
                  <div style={{ width: '68%', height: '100%', background: ACCENT, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>342 of 500 credits used</div>
              </div>
            </motion.div>

            {/* Destinations */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Destinations</div>
              </div>
              {[
                { name: 'UGC System (IG)', color: '#10b981', connected: true },
                { name: 'TikTok', color: '#f43f5e', connected: true },
              ].map((d) => (
                <div key={d.name} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--emerald)' }}>Connected</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
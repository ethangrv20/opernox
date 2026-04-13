'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Video, Clock, Upload, CheckCircle2, Trash2, Play, BarChart2 } from 'lucide-react';

const ACCENT = '#f43f5e';

const MOCK_QUEUE = [
  { id: 1, caption: 'When you finally automate your entire outreach pipeline... #automation #startup #sms', status: 'ready', duration: '0:38', views: '0' },
  { id: 2, caption: 'Why SMS beats email every single time 🗣️ #marketing #sms #b2b', status: 'ready', duration: '0:42', views: '0' },
  { id: 3, caption: 'Day 1 of posting consistently. Let\'s see how this goes #growth #content', status: 'scheduled', duration: '0:35', scheduled: 'Mon 9:00 AM' },
];

export default function TikTokPage() {
  const [tab, setTab] = useState<'queue' | 'analytics' | 'settings'>('queue');
  const [dragOver, setDragOver] = useState(false);

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">TikTok</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>@grv_ethan</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
            <Upload size={12} /> Upload
          </button>
        </div>
      </div>

      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Short-Form Video</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Upload, schedule, and track your TikTok content</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Drop zone */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
              style={{
                background: 'var(--surface)',
                border: `2px dashed ${dragOver ? ACCENT : 'var(--border-2)'}`,
                borderRadius: 'var(--radius)',
                padding: '32px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              <Upload size={22} style={{ color: dragOver ? ACCENT : 'var(--text-3)', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
              <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: 4 }}>{dragOver ? 'Drop video here' : 'Drag & drop a video'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>MP4, MOV, or WebM · Max 500MB · 1080x1920 recommended</div>
              <button style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
                <Video size={13} /> Browse Files
              </button>
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '0 4px', borderBottom: '1px solid var(--border)', display: 'flex' }}>
                {(['queue', 'analytics', 'settings'] as const).map((t) => (
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

              {tab === 'queue' && (
                <div>
                  {MOCK_QUEUE.map((vid, i) => (
                    <motion.div key={vid.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ padding: '14px 16px', borderBottom: i < MOCK_QUEUE.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 52, height: 70, borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                        <Video size={16} style={{ color: 'var(--text-3)' }} />
                        <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: '9px', fontWeight: 700, color: 'var(--text-3)', background: 'rgba(0,0,0,0.6)', borderRadius: 3, padding: '1px 3px' }}>{vid.duration}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12.5px', color: 'var(--text)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vid.caption}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {vid.status === 'ready' ? (
                            <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(16,185,129,0.09)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.16)' }}>✓ ready</span>
                          ) : (
                            <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(245,158,11,0.09)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.16)' }}>
                              <Clock size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {vid.scheduled}
                            </span>
                          )}
                          {vid.status === 'ready' && (
                            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 5, background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '10.5px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
                              <Play size={9} /> Post Now
                            </button>
                          )}
                        </div>
                      </div>
                      <button style={{ width: 28, height: 28, borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0 }}>
                        <Trash2 size={11} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {tab === 'analytics' && (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Total Views', val: '24.8K' },
                      { label: 'Engagement', val: '6.2%' },
                      { label: 'Followers', val: '412' },
                    ].map((s) => (
                      <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '19px', fontWeight: 900, letterSpacing: '-0.5px' }}>{s.val}</div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Top videos</div>
                  {[
                    { caption: 'When you finally automate outreach...', views: '12.1K', likes: '847' },
                    { caption: 'Why SMS beats email', views: '8.4K', likes: '521' },
                  ].map((v) => (
                    <div key={v.caption} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12 }}>{v.caption}</div>
                      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>👁 {v.views}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>❤ {v.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'settings' && (
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Posting Schedule</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                        <div key={d} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 'var(--radius-sm)', background: ['Mon', 'Wed', 'Fri'].includes(d) ? 'rgba(244,63,94,0.08)' : 'var(--surface-2)', border: `1px solid ${['Mon', 'Wed', 'Fri'].includes(d) ? 'rgba(244,63,94,0.15)' : 'var(--border)'}`, fontSize: '11px', fontWeight: 700, color: ['Mon', 'Wed', 'Fri'].includes(d) ? ACCENT : 'var(--text-3)' }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: 6, textAlign: 'center' }}>Active days: Mon, Wed, Fri · 9:00 AM</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Auto-Post</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Scheduled queue</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Automatically post queued videos</div>
                      </div>
                      <div style={{ width: 40, height: 22, borderRadius: 99, background: ACCENT, position: 'relative', cursor: 'pointer' }}>
                        <div style={{ position: 'absolute', right: 3, top: 3, width: 16, height: 16, borderRadius: '50%', background: 'white' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: <Video size={13} />, val: '7', label: 'Videos', sub: 'Total posted' },
                { icon: <CheckCircle2 size={13} />, val: '2', label: 'Ready', sub: 'In queue' },
                { icon: <Music size={13} />, val: '4', label: 'Sounds', sub: 'Used' },
                { icon: <BarChart2 size={13} />, val: '24.8K', label: 'Views', sub: 'This month' },
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

            {/* Trending sounds */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Trending Sounds</div>
              </div>
              {[
                { name: 'Original sound — trending', uses: '12.4K videos' },
                { name: 'Business talk beat', uses: '8.1K videos' },
                { name: 'Motivation speech clip', uses: '5.3K videos' },
              ].map((s, i) => (
                <div key={s.name} style={{ padding: '9px 14px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Music size={11} style={{ color: ACCENT, flexShrink: 0 }} />
                    <span style={{ fontSize: '11.5px', color: 'var(--text-2)' }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{s.uses}</span>
                </div>
              ))}
            </motion.div>

            {/* Schedule */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Schedule</div>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(245,158,11,0.09)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.15)' }}>3 this week</span>
              </div>
              {[
                { day: 'Mon Apr 14', time: '9:00 AM', vid: 'Outreach automation' },
                { day: 'Wed Apr 16', time: '9:00 AM', vid: 'SMS vs email' },
                { day: 'Fri Apr 18', time: '9:00 AM', vid: 'Day 30 update' },
              ].map((s, i) => (
                <div key={s.day} style={{ padding: '9px 14px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)' }}>{s.day} · {s.time}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: 1 }}>{s.vid}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
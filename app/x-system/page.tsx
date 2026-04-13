'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Twitter, Send, Image, Clock, Trash2, BarChart2, Zap, User, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';

const ACCENT = '#06b6d4';

const MOCK_POSTS = [
  { id: 1, text: 'The best time to post on X is when your audience is awake. Most people check their feed at 9am and 6pm.', time: '9:00 AM', status: 'posted', likes: 42 },
  { id: 2, text: 'Automation isn\'t about replacing creativity — it\'s about scaling it.', time: 'Tomorrow 9:00 AM', status: 'scheduled' },
  { id: 3, text: 'Building in public is the best marketing strategy nobody talks about enough.', time: 'Tomorrow 12:00 PM', status: 'scheduled' },
  { id: 4, text: 'Your first 100 followers matter more than your first 10,000. Focus on quality.', time: 'Tomorrow 3:00 PM', status: 'scheduled' },
];

const MOCK_LEAD_MAGNENTS = [
  { id: 1, title: 'The DM Automation Playbook', status: 'approved', uses: 12 },
  { id: 2, title: 'Social Media Growth Hacks', status: 'approved', uses: 8 },
  { id: 3, title: 'X viral formula', status: 'pending', uses: 0 },
];

export default function XSystemPage() {
  const [postText, setPostText] = useState('');
  const [autoPost, setAutoPost] = useState(false);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [tab, setTab] = useState<'queue' | 'analytics' | 'accounts'>('queue');

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">X System</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>@grv_ethan</span>
          </div>
          <button onClick={() => setAutoPost(!autoPost)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${autoPost ? ACCENT : 'var(--border-2)'}`,
            background: autoPost ? 'rgba(6,182,212,0.08)' : 'transparent',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            color: autoPost ? ACCENT : 'var(--text-2)',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            <Zap size={12} /> Auto-Post {autoPost ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Twitter Automation</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Schedule, publish, and manage your X presence</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Compose box */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 6px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={11} style={{ color: 'var(--violet)' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>@grv_ethan</span>
                  <ChevronDown size={11} style={{ color: 'var(--text-3)' }} />
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="What's happening?"
                  style={{
                    width: '100%', minHeight: 100,
                    background: 'transparent', border: 'none', outline: 'none',
                    fontSize: '14px', color: 'var(--text)', resize: 'none',
                    fontFamily: 'inherit', lineHeight: 1.6,
                  }}
                />
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', transition: 'all 0.15s' }}>
                    <Image size={14} />
                  </button>
                  <button style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', transition: 'all 0.15s' }}>
                    <BarChart2 size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '12px', color: postText.length > 280 ? 'var(--red)' : 'var(--text-3)' }}>{postText.length}/280</span>
                  <button disabled={!postText || postText.length > 280} className="btn btn-primary btn-sm">
                    <Send size={11} /> Schedule
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Tabs + Queue */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '0 4px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 0 }}>
                {(['queue', 'analytics', 'accounts'] as const).map((t) => (
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
                  {posts.map((post, i) => (
                    <motion.div key={post.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ padding: '14px 16px', borderBottom: i < posts.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: 6, lineHeight: 1.55 }}>{post.text}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} /> {post.time}
                          </span>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: post.status === 'posted' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: post.status === 'posted' ? 'var(--emerald)' : 'var(--amber)', border: `1px solid ${post.status === 'posted' ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)'}` }}>
                            {post.status === 'posted' ? '✓ ' : '⏱ '}{post.status}
                          </span>
                          {post.status === 'posted' && 'likes' in post && (
                            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>❤ {post.likes}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {post.status === 'scheduled' && (
                          <button style={{ width: 28, height: 28, borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)', fontSize: '10px', transition: 'all 0.15s' }}>
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {tab === 'analytics' && (
                <div style={{ padding: '24px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'Total Posts', val: '24' },
                      { label: 'Impressions', val: '12.4K' },
                      { label: 'Engagement', val: '3.8%' },
                    ].map((s) => (
                      <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-1px' }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { day: 'Mon', posts: 3, engagement: '4.1%' },
                      { day: 'Tue', posts: 2, engagement: '2.9%' },
                      { day: 'Wed', posts: 4, engagement: '5.2%' },
                      { day: 'Thu', posts: 3, engagement: '3.7%' },
                      { day: 'Fri', posts: 2, engagement: '2.4%' },
                    ].map((s) => (
                      <div key={s.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', width: 30 }}>{s.day}</div>
                        <div style={{ flex: 1, height: 4, background: 'var(--surface-3)', borderRadius: 99 }}>
                          <div style={{ width: `${(s.posts / 4) * 100}%`, height: '100%', background: ACCENT, borderRadius: 99 }} />
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-2)', width: 60, textAlign: 'right' }}>{s.posts} posts</div>
                        <div style={{ fontSize: '11px', color: 'var(--emerald)', width: 55, textAlign: 'right' }}>{s.engagement}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'accounts' && (
                <div style={{ padding: '16px' }}>
                  {[
                    { handle: '@grv_ethan', name: 'Ethan G', status: 'active', followers: '2.1K' },
                    { handle: '@textascend', name: 'TextAscend', status: 'active', followers: '890' },
                  ].map((acc) => (
                    <div key={acc.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 6, background: 'var(--surface-2)' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--violet-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--violet)' }}>{acc.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700 }}>{acc.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{acc.handle} · {acc.followers} followers</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--emerald)' }} />
                        <span style={{ fontSize: '11px', color: 'var(--emerald)', fontWeight: 600 }}>{acc.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: <CheckCircle2 size={13} />, val: '4', label: 'Posted', sub: 'This week' },
                { icon: <Clock size={13} />, val: '3', label: 'Queued', sub: 'Upcoming' },
                { icon: <Zap size={13} />, val: autoPost ? 'ON' : 'OFF', label: 'Auto-post', sub: 'Scheduler' },
                { icon: <User size={13} />, val: '2', label: 'Accounts', sub: 'Connected' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <div style={{ color: ACCENT }}>{s.icon}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px', color: s.val === 'ON' ? ACCENT : 'var(--text)' }}>{s.val}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-3)', marginTop: 1 }}>{s.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Lead Magnets */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Lead Magnets</div>
                <button style={{ fontSize: '10.5px', fontWeight: 700, color: ACCENT, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add</button>
              </div>
              <div>
                {MOCK_LEAD_MAGNENTS.map((lm) => (
                  <div key={lm.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: lm.status === 'approved' ? 'var(--emerald)' : 'var(--amber)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lm.title}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{lm.uses} uses</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: lm.status === 'approved' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', color: lm.status === 'approved' ? 'var(--emerald)' : 'var(--amber)' }}>{lm.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Trending */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Trending Topics</div>
              </div>
              <div>
                {['#AIautomation', '#SMSmarketing', '#StartupLife', '#ContentCreation', '#GrowthHacking'].map((tag, i) => (
                  <div key={tag} style={{ padding: '9px 14px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: ACCENT }}>{tag}</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{(Math.random() * 50 + 10).toFixed(0)}K posts</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
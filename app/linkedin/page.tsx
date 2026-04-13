'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Send, Image, BarChart2, Clock, Trash2, Users, FileText, Globe, CheckCircle2 } from 'lucide-react';

const ACCENT = '#0ea5e9';

const MOCK_POSTS = [
  { id: 1, text: 'We helped a client scale their outbound SMS volume by 400% in 90 days — without increasing headcount. The secret? Automation that actually works.', time: '2 days ago', status: 'published', impressions: '1.2K', likes: 38 },
  { id: 2, text: 'Most businesses are leaving money on the table with SMS. Here\'s why it\'s the highest-ROI channel most founders ignore.', time: '5 days ago', status: 'published', impressions: '890', likes: 22 },
];

export default function LinkedInPage() {
  const [postText, setPostText] = useState('');
  const [tab, setTab] = useState<'posts' | 'articles' | 'analytics'>('posts');

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">LinkedIn</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>@ethangurevich</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit' }}>
            <FileText size={12} /> Write Article
          </button>
        </div>
      </div>

      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Content Publishing</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Articles, posts, and audience analytics</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Compose box */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: ACCENT }}>E</span>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Ethan Gurevich</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Co-Founder at TextAscend</div>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Start writing your post..."
                  style={{
                    width: '100%', minHeight: 110,
                    background: 'transparent', border: 'none', outline: 'none',
                    fontSize: '14px', color: 'var(--text)', resize: 'none',
                    fontFamily: 'inherit', lineHeight: 1.65,
                  }}
                />
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[
                    { icon: <Image size={13} />, label: 'Image' },
                    { icon: <Globe size={13} />, label: 'Link' },
                    { icon: <FileText size={13} />, label: 'Document' },
                  ].map((b) => (
                    <button key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-2)', fontSize: '11.5px', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                      {b.icon} {b.label}
                    </button>
                  ))}
                </div>
                <button disabled={!postText} className="btn btn-primary btn-sm">
                  <Send size={11} /> Post
                </button>
              </div>
            </motion.div>

            {/* Tabs + content */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '0 4px', borderBottom: '1px solid var(--border)', display: 'flex' }}>
                {(['posts', 'articles', 'analytics'] as const).map((t) => (
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

              {tab === 'posts' && (
                <div>
                  {MOCK_POSTS.map((post, i) => (
                    <motion.div key={post.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ padding: '16px 18px', borderBottom: i < MOCK_POSTS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <p style={{ fontSize: '13.5px', color: 'var(--text)', marginBottom: 10, lineHeight: 1.65 }}>{post.text}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {post.time}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>👁 {post.impressions} impressions</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>❤ {post.likes}</span>
                        <button style={{ marginLeft: 'auto', width: 26, height: 26, borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)' }}>
                          <BarChart2 size={11} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {tab === 'articles' && (
                <div style={{ padding: '24px 20px' }}>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-2)' }}>
                    <FileText size={20} style={{ color: 'var(--text-3)', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Publish an article</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Long-form content performs better on LinkedIn</div>
                    <button style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
                      <FileText size={12} /> Write Article
                    </button>
                  </div>
                </div>
              )}

              {tab === 'analytics' && (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Followers', val: '1,847', change: '+12 this week' },
                      { label: 'Post impressions', val: '5.2K', change: '+8% vs last week' },
                      { label: 'Engagement', val: '4.1%', change: '+0.3% vs last week' },
                    ].map((s) => (
                      <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-1px' }}>{s.val}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--emerald)', marginTop: 2 }}>{s.change}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Top posts this month</div>
                  {[
                    { title: 'SMS automation client results', impressions: '2.1K', engagement: '5.8%' },
                    { title: 'Why founders ignore SMS marketing', impressions: '1.4K', engagement: '3.2%' },
                  ].map((p) => (
                    <div key={p.title} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{p.title}</div>
                      <div style={{ display: 'flex', gap: 14 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.impressions}</span>
                        <span style={{ fontSize: '11px', color: 'var(--emerald)' }}>{p.engagement}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Profile stats */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: ACCENT }}>E</span>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Ethan Gurevich</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Co-Founder @ TextAscend</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { icon: <Users size={12} />, val: '1,847', label: 'Followers' },
                  { icon: <FileText size={12} />, val: '12', label: 'Posts' },
                ].map((s) => (
                  <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                      <div style={{ color: ACCENT }}>{s.icon}</div>
                      <div style={{ fontSize: '15px', fontWeight: 900 }}>{s.val}</div>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content ideas */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Content Ideas</div>
              </div>
              {[
                { title: 'Behind the scenes: client results', prompts: 3 },
                { title: 'SMS vs email: why SMS wins', prompts: 2 },
                { title: 'Day in the life of a startup founder', prompts: 1 },
              ].map((idea) => (
                <div key={idea.title} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, marginBottom: 3 }}>{idea.title}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{idea.prompts} AI prompts available</div>
                </div>
              ))}
              <div style={{ padding: '10px 14px' }}>
                <button style={{ width: '100%', padding: '7px', borderRadius: 'var(--radius-sm)', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: ACCENT, fontFamily: 'inherit' }}>
                  + Generate with AI
                </button>
              </div>
            </motion.div>

            {/* Scheduled */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Scheduled</div>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(245,158,11,0.09)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.15)' }}>2 pending</span>
              </div>
              {[
                { title: 'Why SMS is the most underrated channel', date: 'Mon, Apr 14 · 9:00 AM' },
                { title: 'Client case study: 400% volume increase', date: 'Wed, Apr 16 · 12:00 PM' },
              ].map((s, i) => (
                <div key={s.title} style={{ padding: '10px 14px', borderBottom: i < 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} /> {s.date}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
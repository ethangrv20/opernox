'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Send, Image, BarChart2, Clock, Users, FileText, Globe, Plug, ChevronDown } from 'lucide-react';

const ACCENT = '#0ea5e9';

export default function LinkedInPage() {
  const [tab, setTab] = useState<'posts' | 'articles' | 'analytics'>('posts');
  const [autoPost, setAutoPost] = useState(false);

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">LinkedIn</div>
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
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Content Publishing</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Articles, posts, and audience analytics</div>
        </motion.div>

        {/* Empty state — connect CTA */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 32px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Linkedin size={20} style={{ color: ACCENT }} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: 6 }}>Connect your LinkedIn account</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.65 }}>
            Link your LinkedIn profile to publish posts, write articles, and track your audience analytics.
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
            <Plug size={13} /> Connect LinkedIn
          </button>
        </motion.div>

        {/* Two-column layout below — visible but empty/disabled */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Compose box — disabled state */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', opacity: 0.6, position: 'relative' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)' }}>?</span>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)' }}>Connect to post</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Link your account to write posts</div>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ minHeight: 110, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Connect your LinkedIn account to compose posts</span>
                </div>
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {['Image', 'Link', 'Document'].map((b) => (
                  <div key={b} style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-4)' }}>{b}</div>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                  <button disabled className="btn btn-primary btn-sm" style={{ opacity: 0.4 }}><Send size={11} /> Post</button>
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
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
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>No posts yet</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Your published posts will appear here once connected</div>
                </div>
              )}
              {tab === 'articles' && (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>No articles yet</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Your LinkedIn articles will appear here once connected</div>
                </div>
              )}
              {tab === 'analytics' && (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>No analytics yet</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Audience stats will populate once your account is connected</div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Profile — empty */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-3)' }}>?</span>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)' }}>Not connected</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Connect to see profile</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ label: 'Followers', val: '—' }, { label: 'Posts', val: '—' }].map((s) => (
                  <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900 }}>{s.val}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduled — empty */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Scheduled</div>
              </div>
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No scheduled posts</div>
              </div>
            </motion.div>

            {/* Auto-post toggle */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Settings</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>Auto-post</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Requires account connection</div>
                  </div>
                  <div
                    onClick={() => {}}
                    style={{ width: 36, height: 20, borderRadius: 99, background: 'var(--surface-3)', position: 'relative', cursor: 'not-allowed' }}>
                    <div style={{ position: 'absolute', left: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'var(--text-3)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>AI Content Suggestions</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Generate post ideas</div>
                  </div>
                  <div
                    onClick={() => {}}
                    style={{ width: 36, height: 20, borderRadius: 99, background: 'var(--surface-3)', position: 'relative', cursor: 'not-allowed' }}>
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
'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Twitter, Send, Clock, Plug, ChevronDown, User, CheckCircle, X as XIcon, Trash2, Zap, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ACCENT = '#06b6d4';

type PostStatus = 'scheduled' | 'published' | 'failed' | 'cancelled';
type Tab = 'queue' | 'analytics' | 'accounts';
type AutoDaypart = 'morning' | 'midday' | 'evening';

interface XConnection {
  id: string;
  screen_name: string;
  status: string;
  connected_at: string;
}

interface ScheduledPost {
  id: string;
  platform: string;
  post_text: string;
  scheduled_for: string;
  status: PostStatus;
  published_at: string | null;
  external_id: string | null;
  created_at: string;
}

interface PostStats {
  posts_today: number;
  queue_count: number;
  accounts_count: number;
}

export default function XSystemPage() {
  const [connection, setConnection] = useState<XConnection | null>(null);
  const [postText, setPostText] = useState('');
  const [schedulingFor, setSchedulingFor] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>('queue');
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [autoPost, setAutoPost] = useState({ morning: false, midday: false, evening: false });
  const [stats, setStats] = useState<PostStats>({ posts_today: 0, queue_count: 0, accounts_count: 0 });

  // Load X connection
  useEffect(() => {
    supabase
      .from('x_connections')
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) setConnection(data);
      });
  }, []);

  // Load scheduled posts
  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('platform', 'x')
      .order('scheduled_for', { ascending: true });
    if (data) {
      setPosts(data);
      setStats(s => ({ ...s, queue_count: data.filter((p: ScheduledPost) => p.status === 'scheduled').length }));
    }
    setLoadingPosts(false);
  }, []);

  // Load stats + posts on mount
  useEffect(() => {
    loadPosts();
    // Posts today count
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('scheduled_posts')
      .select('id', { count: 'exact', head: true })
      .eq('platform', 'x')
      .eq('status', 'published')
      .gte('published_at', today)
      .then(({ count }) => setStats(s => ({ ...s, posts_today: count || 0 })));
    // Accounts count
    supabase
      .from('x_connections')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'connected')
      .then(({ count }) => setStats(s => ({ ...s, accounts_count: count || 0 })));
  }, [loadPosts]);

  // Schedule a post
  const handleSchedule = async () => {
    if (!postText.trim()) return;
    if (!schedulingFor) {
      setScheduleMsg({ type: 'error', text: 'Pick a date and time' });
      return;
    }
    setIsScheduling(true);
    setScheduleMsg(null);
    const { error } = await supabase.from('scheduled_posts').insert({
      platform: 'x',
      post_text: postText.trim(),
      scheduled_for: schedulingFor,
      status: 'scheduled',
    });
    if (error) {
      setScheduleMsg({ type: 'error', text: error.message });
    } else {
      setScheduleMsg({ type: 'ok', text: 'Post scheduled!' });
      setPostText('');
      setSchedulingFor('');
      loadPosts();
    }
    setIsScheduling(false);
    setTimeout(() => setScheduleMsg(null), 3000);
  };

  // Delete a scheduled post
  const handleDelete = async (id: string) => {
    await supabase.from('scheduled_posts').delete().eq('id', id);
    loadPosts();
  };

  // Format date for display
  const fmt = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (isToday) return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${time}`;
  };

  const isConnected = !!connection;

  return (
    <div>
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-title">X System</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
              <CheckCircle size={12} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>@{connection.screen_name}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-3)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)' }}>Not connected</span>
            </div>
          )}
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit' }}>
            <Plug size={12} /> Connect
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Twitter Automation</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Schedule, publish, and manage your X presence</div>
        </motion.div>

        {/* Not connected state */}
        {!isConnected && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 32px', textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Twitter size={20} style={{ color: ACCENT }} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: 6 }}>Connect your X account</div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.65 }}>
              Link your X/Twitter account to schedule posts, manage your queue, and track performance analytics.
            </div>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
              <Plug size={13} /> Connect X
            </button>
          </motion.div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isConnected ? '1fr 300px' : '1fr', gap: 14, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Compose box */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', opacity: isConnected ? 1 : 0.5, pointerEvents: isConnected ? 'auto' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 6px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: ACCENT + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Twitter size={11} style={{ color: ACCENT }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>{isConnected ? '@' + connection.screen_name : 'Not connected'}</span>
                  <ChevronDown size={11} style={{ color: 'var(--text-4)' }} />
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <textarea
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder={isConnected ? "What's happening?" : 'Connect your account to compose posts'}
                  disabled={!isConnected}
                  rows={4}
                  style={{
                    width: '100%', minHeight: 90, background: 'var(--surface-2)', border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '13px', color: 'var(--text)',
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                    opacity: isConnected ? 1 : 0.4,
                  }}
                />
                {scheduleMsg && (
                  <div style={{ marginTop: 8, fontSize: '12px', fontWeight: 600, color: scheduleMsg.type === 'ok' ? '#10b981' : '#f43f5e' }}>
                    {scheduleMsg.text}
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-3)' }}>
                    <Calendar size={11} style={{ color: 'var(--text-4)' }} />
                    <input
                      type="datetime-local"
                      value={schedulingFor}
                      onChange={e => setSchedulingFor(e.target.value)}
                      disabled={!isConnected}
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-2)', fontSize: '11px', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleSchedule}
                  disabled={!isConnected || isScheduling}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: isConnected && !isScheduling ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'inherit', opacity: isScheduling ? 0.7 : 1 }}
                >
                  {isScheduling ? 'Scheduling...' : <><Clock size={11} /> Schedule</>}
                </button>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '0 4px', borderBottom: '1px solid var(--border)', display: 'flex' }}>
                {(['queue', 'analytics', 'accounts'] as Tab[]).map((t) => (
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

              {/* Queue tab */}
              {tab === 'queue' && (
                <div>
                  {loadingPosts ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Loading...</div>
                    </div>
                  ) : posts.length === 0 ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>No scheduled posts</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Write something above to get started</div>
                    </div>
                  ) : (
                    <div>
                      {posts.map((post) => (
                        <div key={post.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: 6, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{post.post_text}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={10} />
                              {fmt(post.scheduled_for)}
                              {post.status === 'published' && <span style={{ color: '#10b981' }}>· Posted</span>}
                              {post.status === 'failed' && <span style={{ color: '#f43f5e' }}>· Failed</span>}
                              {post.status === 'cancelled' && <span style={{ color: 'var(--text-4)' }}>· Cancelled</span>}
                            </div>
                          </div>
                          {post.status === 'scheduled' && (
                            <button onClick={() => handleDelete(post.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4 }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Analytics tab */}
              {tab === 'analytics' && (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>Analytics coming soon</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Post performance will appear here after your first posts go live</div>
                </div>
              )}

              {/* Accounts tab */}
              {tab === 'accounts' && (
                <div>
                  {connection ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: ACCENT + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Twitter size={16} style={{ color: ACCENT }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>@{connection.screen_name}</div>
                        <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                          Connected {new Date(connection.connected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No accounts connected</div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar — only show when connected */}
          {isConnected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Posts Today', val: stats.posts_today || '—' },
                  { label: 'Queue', val: stats.queue_count || 0 },
                  { label: 'Auto-Post', val: autoPost.morning || autoPost.midday || autoPost.evening ? 'ON' : 'OFF' },
                  { label: 'Accounts', val: stats.accounts_count || 0 },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>{s.val}</div>
                  </motion.div>
                ))}
              </div>

              {/* Auto-post dayparts */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={12} style={{ color: ACCENT }} />
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Auto-Post</div>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {([
                    { key: 'morning', label: 'Morning', sub: '7 – 9 AM', icon: '🌅' },
                    { key: 'midday', label: 'Midday', sub: '11 AM – 1 PM', icon: '☀️' },
                    { key: 'evening', label: 'Evening', sub: '5 – 7 PM', icon: '🌙' },
                  ] as { key: AutoDaypart; label: string; sub: string; icon: string }[]).map(({ key, label, sub, icon }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>{icon} {label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{sub}</div>
                      </div>
                      <button
                        onClick={() => setAutoPost(p => ({ ...p, [key]: !p[key] }))}
                        style={{ width: 36, height: 20, borderRadius: 99, background: autoPost[key] ? ACCENT : 'var(--surface-3)', position: 'relative', cursor: 'pointer', border: 'none', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', left: autoPost[key] ? 18 : 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Connected account */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Connected Account</div>
                </div>
                <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: ACCENT + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Twitter size={14} style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>@{connection.screen_name}</div>
                    <div style={{ fontSize: '11px', color: '#10b981' }}>Active</div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

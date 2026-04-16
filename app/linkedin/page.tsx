'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Send, Clock, CheckCircle, Plug, ChevronDown, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMcUrl } from '@/lib/mc-url';

const ACCENT = '#0ea5e9';

type PostStatus = 'scheduled' | 'published' | 'failed' | 'cancelled';
type Tab = 'posts' | 'articles' | 'analytics';
type AutoDaypart = 'morning' | 'midday' | 'evening';

interface LinkedInConnection {
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

export default function LinkedInPage() {
  const [connection, setConnection] = useState<LinkedInConnection | null>(null);
  const [postText, setPostText] = useState('');
  const [schedulingFor, setSchedulingFor] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPostingNow, setIsPostingNow] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [autoPost, setAutoPost] = useState({ morning: false, midday: false, evening: false });
  const [autoPostLinkedIn, setAutoPostLinkedIn] = useState(false);
  const [autoPostHourLinkedIn, setAutoPostHourLinkedIn] = useState(13);
  const [mcUrl, setMcUrl] = useState('http://127.0.0.1:3337');

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingPosts(false); return; }
    const { data } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'linkedin')
      .order('scheduled_for', { ascending: true });
    if (data) setPosts(data);
    setLoadingPosts(false);
  }, []);

  useEffect(() => {
    getMcUrl().then(url => setMcUrl(url));
  }, []);

  useEffect(() => {
    loadPosts();
    // Load LinkedIn auto-post state
    fetch(mcUrl + '/api/auto-post-state?platform=linkedin')
      .then(r => r.json())
      .then(data => { if (data.enabled !== undefined) { setAutoPostLinkedIn(data.enabled); setAutoPostHourLinkedIn(data.hourUtc || 13); } })
      .catch(() => {});
  }, [loadPosts, mcUrl]);

  useEffect(() => {
    // Load LinkedIn account from accounts table
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('accounts')
        .select('id, name, adspower_id, status, created_at')
        .eq('user_id', user.id)
        .eq('account_system', 'linkedin')
        .eq('status', 'active')
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setConnection({ id: data[0].id, screen_name: data[0].name || 'LinkedIn', status: 'connected', connected_at: data[0].created_at });
          }
        });
    });
  }, []);

  const handleAutoPostToggleLinkedIn = async () => {
    const newVal = !autoPostLinkedIn;
    setAutoPostLinkedIn(newVal);
    try {
      const res = await fetch(mcUrl + '/api/auto-post-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'linkedin', enabled: newVal, hourUtc: autoPostHourLinkedIn }),
      });
      const data = await res.json();
      if (data.state) { setAutoPostLinkedIn(data.state.enabled); setAutoPostHourLinkedIn(data.state.hourUtc); }
    } catch { setAutoPostLinkedIn(newVal); }
  };

  const handlePostNow = async () => {
    if (!postText.trim()) return;
    setIsPostingNow(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsPostingNow(false); return; }
    const { error } = await supabase.from('scheduled_posts').insert({
      platform: 'linkedin',
      post_text: postText.trim(),
      scheduled_for: new Date().toISOString(),
      status: 'scheduled',
      user_id: user.id,
    });
    if (error) {
      setScheduleMsg({ type: 'error', text: error.message });
    } else {
      setPostText('');
      loadPosts();
    }
    setIsPostingNow(false);
    setTimeout(() => setScheduleMsg(null), 3000);
  };

  const handleSchedule = async () => {
    if (!postText.trim()) return;
    if (!schedulingFor) {
      setScheduleMsg({ type: 'error', text: 'Pick a date and time' });
      setTimeout(() => setScheduleMsg(null), 3000);
      return;
    }
    setIsScheduling(true);
    setScheduleMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('scheduled_posts').insert({
      platform: 'linkedin',
      post_text: postText.trim(),
      scheduled_for: schedulingFor,
      status: 'scheduled',
      user_id: user?.id,
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

  const handleDelete = async (id: string) => {
    await supabase.from('scheduled_posts').delete().eq('id', id);
    loadPosts();
  };

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
      <div className="topbar">
        <div className="topbar-title">LinkedIn</div>
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Content Publishing</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Articles, posts, and audience analytics</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: isConnected ? '1fr 300px' : '1fr', gap: 14, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Compose box */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', opacity: isConnected ? 1 : 0.5, pointerEvents: isConnected ? 'auto' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 6px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: ACCENT + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Linkedin size={11} style={{ color: ACCENT }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>{isConnected ? '@' + connection.screen_name : 'Not connected'}</span>
                  <ChevronDown size={11} style={{ color: 'var(--text-4)' }} />
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <textarea
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder={isConnected ? "Write an article, share an update, or celebrate a win..." : 'Connect your account to compose posts'}
                  disabled={!isConnected}
                  rows={5}
                  style={{
                    width: '100%', minHeight: 100, background: 'var(--surface-2)', border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '13px', color: 'var(--text)',
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {scheduleMsg && (
                  <div style={{ marginTop: 8, padding: '7px 12px', borderRadius: 'var(--radius-sm)', background: scheduleMsg.type === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid ' + (scheduleMsg.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'), fontSize: '12px', fontWeight: 600, color: scheduleMsg.type === 'ok' ? '#10b981' : '#ef4444' }}>
                    {scheduleMsg.text}
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-3)' }}>
                  <Clock size={12} />
                  <input
                    type="datetime-local"
                    value={schedulingFor}
                    onChange={e => setSchedulingFor(e.target.value)}
                    disabled={!isConnected}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: '12px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleSchedule}
                    disabled={!isConnected || isScheduling}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-2)', background: 'transparent', cursor: isConnected ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit', opacity: isScheduling ? 0.6 : 1 }}>
                    <Calendar size={11} /> Schedule
                  </button>
                  <button
                    onClick={handlePostNow}
                    disabled={!isConnected || isPostingNow}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 16px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: isConnected ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'inherit', opacity: isPostingNow ? 0.6 : 1 }}>
                    <Send size={11} /> {isPostingNow ? 'Posting...' : 'Post Now'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Posts queue */}
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
                <div style={{ padding: '0' }}>
                  {loadingPosts ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>Loading...</div>
                  ) : posts.length === 0 ? (
                    <div style={{ padding: '36px 24px', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>No posts yet</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Your queue and published posts will appear here</div>
                    </div>
                  ) : (
                    posts.map(post => (
                      <div key={post.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: 4, lineHeight: 1.5 }}>{post.post_text}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: post.status === 'published' ? 'rgba(16,185,129,0.1)' : post.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)', color: post.status === 'published' ? '#10b981' : post.status === 'failed' ? '#ef4444' : '#eab308' }}>
                              {post.status}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{fmt(post.scheduled_for)}</span>
                          </div>
                        </div>
                        {post.status === 'scheduled' && (
                          <button onClick={() => handleDelete(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4 }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
              {tab === 'articles' && (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>No articles yet</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>LinkedIn articles will appear here</div>
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
            {/* Profile */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: ACCENT + '20', border: '1px solid ' + ACCENT + '30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: ACCENT }}>{isConnected ? connection.screen_name[0].toUpperCase() : '?'}</span>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{isConnected ? '@' + connection.screen_name : 'Not connected'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>LinkedIn</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ label: 'Posts', val: posts.filter(p => p.status === 'published').length || '—' }, { label: 'Queued', val: posts.filter(p => p.status === 'scheduled').length || '—' }].map((s) => (
                  <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900 }}>{s.val}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduled */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Scheduled</div>
              </div>
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  {posts.filter(p => p.status === 'scheduled').length === 0 ? 'No scheduled posts' : `${posts.filter(p => p.status === 'scheduled').length} scheduled`}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Settings</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>Auto-post</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Daily text post via content engine</div>
                  </div>
                  <button
                    onClick={handleAutoPostToggleLinkedIn}
                    style={{ width: 36, height: 20, borderRadius: 99, background: autoPostLinkedIn ? '#10b981' : 'var(--surface-3)', position: 'relative', cursor: 'pointer', border: 'none', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', left: autoPostLinkedIn ? 19 : 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                  </button>
                </div>
                {autoPostLinkedIn && (
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Next post: tomorrow ~{autoPostHourLinkedIn > 12 ? autoPostHourLinkedIn - 12 + 'PM' : autoPostHourLinkedIn + 'AM'} UTC</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Twitter, Send, Clock, Plug, ChevronDown, User, CheckCircle, X as XIcon, Trash2, Zap, Calendar, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMcUrl } from '@/lib/mc-url';

const ACCENT = '#06b6d1';

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

// PIN Modal component
function PinModal({ oauthToken, authUrl, mcUrl, onComplete, onClose }: {
  oauthToken: string;
  authUrl: string;
  mcUrl: string;
  onComplete: (screenName: string) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'authorize' | 'enter_pin'>('authorize');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Open Twitter auth page immediately when modal appears
  useEffect(() => {
    window.open(authUrl, '_blank', 'noopener,noreferrer');
    // Small delay then transition to PIN entry
    const t = setTimeout(() => setStep('enter_pin'), 1500);
    return () => clearTimeout(t);
  }, [authUrl]);

  // Focus pin input when shown
  useEffect(() => {
    if (step === 'enter_pin' && pinInputRef.current) {
      setTimeout(() => pinInputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleSubmitPin = async () => {
    const cleaned = pin.trim().replace(/\s/g, '');
    if (!cleaned || cleaned.length < 5) {
      setPinError('Enter the 7-digit PIN shown on Twitter');
      return;
    }
    setPinError('');
    setSubmitting(true);
    try {
      const res = await fetch(mcUrl + '/api/x/oauth/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oauth_token: oauthToken, pin: cleaned }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPinError(data.error || 'Failed to connect X. Please try again.');
        setSubmitting(false);
        return;
      }
      onComplete(data.screen_name);
    } catch (e: any) {
      setPinError('Connection failed: ' + e.message);
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmitPin();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, width: '100%', maxWidth: 420,
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,209,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Twitter size={16} style={{ color: ACCENT }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>Connect X</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Step {step === 'authorize' ? '1' : '2'} of 2</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6 }}>
            <XIcon size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Authorizing */}
          {step === 'authorize' && (
            <motion.div key="step1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ textAlign: 'center', padding: '12px 0 8px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(6,182,209,0.1)', border: '2px solid ' + ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Loader2 size={20} style={{ color: ACCENT }} className="spin" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Opening Twitter...</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
                A new tab will open where you<br />authorize Opernox to post on your behalf.
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--text-4)' }}>
                <ExternalLink size={11} />
                Check your browser tabs
              </div>
            </motion.div>
          )}

          {/* Step 2: Enter PIN */}
          {step === 'enter_pin' && (
            <motion.div key="step2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{}}>
              <div style={{ background: 'rgba(6,182,209,0.06)', border: '1px solid rgba(6,182,209,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <ShieldCheck size={15} style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                  Twitter showed you a <strong>7-digit PIN</strong>. Enter it below to finish connecting your account.
                </div>
              </div>

              <div style={{ marginBottom: 6 }}>
                <input
                  ref={pinInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                  onKeyDown={handleKeyDown}
                  placeholder="1234567"
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: 20,
                    fontFamily: 'monospace', letterSpacing: '0.2em',
                    background: 'var(--surface-2)', border: '1.5px solid ' + (pinError ? '#f43f5e' : 'var(--border-2)'),
                    borderRadius: 10, color: 'var(--text)', outline: 'none', textAlign: 'center', boxSizing: 'border-box'
                  }}
                />
              </div>

              {pinError && (
                <div style={{ fontSize: 11.5, color: '#f43f5e', marginBottom: 12, textAlign: 'center' }}>{pinError}</div>
              )}

              <button
                onClick={handleSubmitPin}
                disabled={submitting || !pin.trim()}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
                  background: submitting ? 'var(--surface-3)' : ACCENT,
                  border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 700, color: 'white',
                  fontFamily: 'inherit', opacity: submitting ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                {submitting ? <><Loader2 size={13} className="spin" /> Connecting...</> : <><CheckCircle size={13} /> Finish Connecting</>}
              </button>

              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'var(--text-4)', lineHeight: 1.5 }}>
                Didn't get a PIN?{' '}
                <button onClick={() => { setStep('authorize'); setPin(''); setPinError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, fontSize: 11, fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>
                  Try again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function XSystemPage() {
  const [connection, setConnection] = useState<XConnection | null>(null);
  const [postText, setPostText] = useState('');
  const [schedulingFor, setSchedulingFor] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPostingNow, setIsPostingNow] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [tab, setTab] = useState<Tab>('queue');
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [autoPost, setAutoPost] = useState({ morning: false, midday: false, evening: false });
  const [stats, setStats] = useState<PostStats>({ posts_today: 0, queue_count: 0, accounts_count: 0 });
  const [connecting, setConnecting] = useState(false);
  const [mcUrl, setMcUrl] = useState('http://127.0.0.1:3337');
  const [pinModal, setPinModal] = useState<{ oauth_token: string; authUrl: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => { getMcUrl().then(url => setMcUrl(url)); }, []);

  // Connect X via Twitter OAuth — starts flow, opens PIN modal
  const handleConnectX = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setConnecting(true);
    try {
      const res = await fetch(mcUrl + '/api/x/oauth/authorize?user_id=' + user.id);
      const data = await res.json();
      if (data.authUrl && data.oauth_token) {
        setPinModal({ oauth_token: data.oauth_token, authUrl: data.authUrl });
      } else {
        alert('Failed to start X OAuth: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Failed to connect X: ' + e.message);
    } finally {
      setConnecting(false);
    }
  };

  // Called when PIN flow completes successfully
  const handlePinComplete = (screenName: string) => {
    setConnection({ id: '', screen_name: screenName, status: 'connected', connected_at: new Date().toISOString() });
    setPinModal(null);
  };

  // Disconnect X account
  const handleDisconnect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !confirm('Disconnect your X account?')) return;
    setDisconnecting(true);
    try {
      await fetch(mcUrl + '/api/x/oauth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      setConnection(null);
    } catch (e: any) {
      alert('Failed to disconnect: ' + e.message);
    } finally {
      setDisconnecting(false);
    }
  };

  // Load X connection
  const loadConnection = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const res = await fetch(mcUrl + '/api/x/oauth/status?user_id=' + user.id);
      const data = await res.json();
      if (data.connected) {
        setConnection({ id: '', screen_name: data.screen_name, status: 'connected', connected_at: data.connected_at || new Date().toISOString() });
      } else {
        setConnection(null);
      }
    } catch {
      // If MC server unreachable, try direct Supabase
      const { data } = await supabase
        .from('x_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'connected')
        .single();
      if (data) setConnection(data);
    }
  }, [mcUrl, supabase]);

  useEffect(() => { loadConnection(); }, [loadConnection]);

  // Handle OAuth success redirect param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_success')) {
      loadConnection();
      window.history.replaceState({}, '', '/x-system');
    }
  }, [loadConnection]);

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
  }, [supabase]);

  useEffect(() => {
    loadPosts();
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('scheduled_posts')
      .select('id', { count: 'exact', head: true })
      .eq('platform', 'x')
      .eq('status', 'published')
      .gte('published_at', today)
      .then(({ count }) => setStats(s => ({ ...s, posts_today: count || 0 })));
    supabase
      .from('x_connections')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'connected')
      .then(({ count }) => setStats(s => ({ ...s, accounts_count: count || 0 })));
  }, [loadPosts, supabase]);

  const handlePostNow = async () => {
    if (!postText.trim()) return;
    setIsPostingNow(true);
    await supabase.from('scheduled_posts').insert({
      platform: 'x',
      post_text: postText.trim(),
      scheduled_for: new Date().toISOString(),
      status: 'scheduled',
    });
    setPostText('');
    loadPosts();
    setIsPostingNow(false);
    setTimeout(() => setScheduleMsg(null), 3000);
  };

  const handleSchedule = async () => {
    if (!postText.trim()) return;
    if (!schedulingFor) { setScheduleMsg({ type: 'error', text: 'Pick a date and time' }); return; }
    setIsScheduling(true);
    setScheduleMsg(null);
    const { error } = await supabase.from('scheduled_posts').insert({
      platform: 'x',
      post_text: postText.trim(),
      scheduled_for: schedulingFor,
      status: 'scheduled',
    });
    if (error) setScheduleMsg({ type: 'error', text: error.message });
    else { setScheduleMsg({ type: 'ok', text: 'Post scheduled!' }); setPostText(''); setSchedulingFor(''); loadPosts(); }
    setIsScheduling(false);
    setTimeout(() => setScheduleMsg(null), 3000);
  };

  const handleAutoPostToggle = async (key: AutoDaypart) => {
    const newVal = !autoPost[key];
    setAutoPost(p => ({ ...p, [key]: newVal }));
    if (newVal) {
      const offsets: Record<AutoDaypart, { hour: number; min: number }> = { morning: { hour: 7, min: 0 }, midday: { hour: 12, min: 0 }, evening: { hour: 17, min: 0 } };
      const { hour, min } = offsets[key];
      let next = new Date();
      next.setHours(hour + 6, min, 0, 0);
      if (next <= new Date()) next.setDate(next.getDate() + 1);
      await supabase.from('scheduled_posts').insert({ platform: 'x', post_text: '', scheduled_for: next.toISOString(), status: 'scheduled' });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('scheduled_posts').delete().eq('id', id);
    loadPosts();
  };

  const fmt = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (isToday) return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${time}`;
  };

  const isConnected = !!connection;

  return (
    <>
      <AnimatePresence>
        {pinModal && (
          <PinModal
            oauthToken={pinModal.oauth_token}
            authUrl={pinModal.authUrl}
            mcUrl={mcUrl}
            onComplete={handlePinComplete}
            onClose={() => setPinModal(null)}
          />
        )}
      </AnimatePresence>

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
          {isConnected ? (
            <button onClick={handleDisconnect} disabled={disconnecting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'transparent', cursor: disconnecting ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit', opacity: disconnecting ? 0.6 : 1 }}>
              {disconnecting ? <Loader2 size={12} className="spin" /> : <XIcon size={12} />} Disconnect
            </button>
          ) : (
            <button onClick={handleConnectX} disabled={connecting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-2)', background: 'transparent', cursor: connecting ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit', opacity: connecting ? 0.6 : 1 }}>
              {connecting ? <Loader2 size={12} className="spin" /> : <Plug size={12} />} {connecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Twitter Automation</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Schedule, publish, and manage your X presence</div>
        </motion.div>

        {/* Not connected state */}
        {!isConnected && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 32px', textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(6,182,209,0.08)', border: '1px solid rgba(6,182,209,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Twitter size={20} style={{ color: ACCENT }} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: 6 }}>Connect your X account</div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.65 }}>
              Link your X/Twitter account to schedule posts, manage your queue, and track performance analytics.
            </div>
            <button onClick={handleConnectX} disabled={connecting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: connecting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'inherit', opacity: connecting ? 0.6 : 1 }}>
              {connecting ? <><Loader2 size={13} className="spin" /> Connecting...</> : <><Plug size={13} /> Connect X</>}
            </button>
          </motion.div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isConnected ? '1fr 300px' : '1fr', gap: 14, alignItems: 'start' }}>
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
                <textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder={isConnected ? "What's happening?" : 'Connect your account to compose posts'} disabled={!isConnected} rows={4}
                  style={{ width: '100%', minHeight: 90, background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '13px', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', opacity: isConnected ? 1 : 0.4 }} />
                {scheduleMsg && <div style={{ marginTop: 8, fontSize: '12px', fontWeight: 600, color: scheduleMsg.type === 'ok' ? '#10b981' : '#f43f5e' }}>{scheduleMsg.text}</div>}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-3)' }}>
                    <Calendar size={11} style={{ color: 'var(--text-4)' }} />
                    <input type="datetime-local" value={schedulingFor} onChange={e => setSchedulingFor(e.target.value)} disabled={!isConnected} style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-2)', fontSize: '11px', fontFamily: 'inherit' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handlePostNow} disabled={!isConnected || isPostingNow}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1.5px solid var(--border-2)', cursor: isConnected && !isPostingNow ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', fontFamily: 'inherit', opacity: isPostingNow ? 0.7 : 1 }}>
                    {isPostingNow ? 'Posting...' : <><Zap size={11} /> Post Now</>}
                  </button>
                  <button onClick={handleSchedule} disabled={!isConnected || isScheduling}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: isConnected && !isScheduling ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'inherit', opacity: isScheduling ? 0.7 : 1 }}>
                    {isScheduling ? 'Scheduling...' : <><Clock size={11} /> Schedule</>}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '0 4px', borderBottom: '1px solid var(--border)', display: 'flex' }}>
                {(['queue', 'analytics', 'accounts'] as Tab[]).map((t) => (
                  <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: tab === t ? 'var(--text)' : 'var(--text-3)', background: 'transparent', borderBottom: `2px solid ${tab === t ? ACCENT : 'transparent'}`, transition: 'all 0.15s' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {tab === 'queue' && (
                <div>
                  {loadingPosts ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center' }}><div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Loading...</div></div>
                  ) : posts.length === 0 ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>No scheduled posts</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Write something above to get started</div>
                    </div>
                  ) : (
                    <div>{posts.map((post) => (
                      <div key={post.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: 6, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{post.post_text}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={10} />{fmt(post.scheduled_for)}
                            {post.status === 'published' && <span style={{ color: '#10b981' }}>· Posted</span>}
                            {post.status === 'failed' && <span style={{ color: '#f43f5e' }}>· Failed</span>}
                            {post.status === 'cancelled' && <span style={{ color: 'var(--text-4)' }}>· Cancelled</span>}
                          </div>
                        </div>
                        {post.status === 'scheduled' && (
                          <button onClick={() => handleDelete(post.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4 }}><Trash2 size={13} /></button>
                        )}
                      </div>
                    ))}</div>
                  )}
                </div>
              )}

              {tab === 'analytics' && (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>Analytics coming soon</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Post performance will appear here after your first posts go live</div>
                </div>
              )}

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

          {/* Right sidebar */}
          {isConnected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                      <button onClick={() => handleAutoPostToggle(key)}
                        style={{ width: 36, height: 20, borderRadius: 99, background: autoPost[key] ? ACCENT : 'var(--surface-3)', position: 'relative', cursor: 'pointer', border: 'none', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', left: autoPost[key] ? 18 : 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

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
    </>
  );
}
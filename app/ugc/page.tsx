'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Clock, CheckCircle, AlertCircle, Play, Square, Zap, Instagram, RefreshCw, Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { getMcUrl } from '@/lib/mc-url';

const ACCENT = '#ec4899';

interface IGAccount {
  id: string;
  name?: string;
  username: string;
  adspower_id?: string;
  status: string;
  days_active?: number;
  current_daily_limit?: number;
  warmup_completed?: boolean;
  warmup_days_completed?: number;
}

interface UGCRunState {
  status: 'idle' | 'generating' | 'posting' | 'done' | 'error';
  phase: string | null;
  heyGenComplete: boolean;
  heyGenProgress: number;
  igComplete: boolean;
  igProgress: number;
  totalPosts: number;
  lastPost: string | null;
  error: string | null;
}

interface AutoPostState {
  enabled: boolean;
  hourUtc: number;
  scenario: 'A' | 'B';
  scheduleTime: string; // HH:MM in local time
}

export default function UGCPase() {
  const [autoPost, setAutoPost] = useState<AutoPostState>({
    enabled: false,
    hourUtc: 14,
    scenario: 'A',
    scheduleTime: '09:00',
  });
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [accounts, setAccounts] = useState<IGAccount[]>([]);
  const [runState, setRunState] = useState<UGCRunState>({
    status: 'idle',
    phase: null,
    heyGenComplete: false,
    heyGenProgress: 0,
    igComplete: false,
    igProgress: 0,
    totalPosts: 0,
    lastPost: null,
    error: null,
  });
  const [manualRunning, setManualRunning] = useState(false);
  const [mcUrl, setMcUrl] = useState('http://127.0.0.1:3337');
  const [warmupSched, setWarmupSched] = useState<Record<string, { enabled: boolean }>>({});
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const showToast = (type: 'ok' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // Load auto-post state + IG accounts
  const loadState = useCallback(async () => {
    try {
      const [autoRes, accRes] = await Promise.all([
        fetch(mcUrl + '/api/instagram/auto-post').catch(() => null),
        fetch(mcUrl + '/api/ugc/accounts').catch(() => null),
      ]);
      const autoJson = autoRes ? await autoRes.json().catch(() => null) : null;
      const accJson = accRes ? await accRes.json().catch(() => null) : null;
      if (autoJson && typeof autoJson === 'object' && 'enabled' in autoJson) {
        setAutoPost(prev => ({
          ...prev,
          enabled: (autoJson as any).enabled,
          hourUtc: (autoJson as any).hourUtc || 14,
        }));
      }
      if (accJson && typeof accJson === 'object' && 'accounts' in accJson) {
        setAccounts((accJson as any).accounts || []);
      }
    } catch (e) {
      console.error('loadState error:', e);
    }
  }, []);

  // Poll run state
  const pollRunState = useCallback(async () => {
    try {
      const res = await fetch(mcUrl + '/api/tiktok').then(r => r.json());
      // tiktok-state tracks both â€” check if there's IG-specific state
      // The bridge-to-ig.cjs writes to the same state file
      setRunState({
        status: res.status || 'idle',
        phase: res.phaseLabel || res.phase || null,
        heyGenComplete: res.heyGenComplete || false,
        heyGenProgress: res.heyGenProgress || 0,
        igComplete: res.igComplete || false,
        igProgress: res.igProgress || 0,
        totalPosts: res.totalPosts || 0,
        lastPost: res.lastPost || null,
        error: res.error || null,
      });
    } catch { /* ignore */ }
  }, []);

  // Fetch warmup schedule from VPS scheduler
  const fetchWarmupSchedule = useCallback(async (url: string) => {
    try {
      const res = await fetch(url + '/api/ig/warmup/schedule');
      if (res.ok) {
        const data = await res.json();
        setWarmupSched(data as Record<string, { enabled: boolean }>);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    getMcUrl().then(url => {
      setMcUrl(url);
      // Load campaign schedule from VPS scheduler
      fetch(url + '/api/campaigns/schedule')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const igSc = data['ig_ugc'];
          if (igSc) {
            setAutoPost(prev => ({
              ...prev,
              enabled: igSc.enabled,
              hourUtc: igSc.hour_utc || prev.hourUtc,
              scenario: (igSc.scenario === 'B' ? 'B' : 'A') as 'A' | 'B',
            }));
          }
        })
        .catch(() => {});
      // Load warmup schedule for IG accounts
      fetchWarmupSchedule(url);
    });
  }, []);

  useEffect(() => {
    if (!mcUrl) return;
    loadState();
  }, [mcUrl, loadState]);

  useEffect(() => {
    pollRunState();
    const interval = setInterval(pollRunState, 4000);
    return () => clearInterval(interval);
  }, [pollRunState]);

  const handleAutoPostToggle = async () => {
    setLoadingAuto(true);
    const newEnabled = !autoPost.enabled;
    try {
      // Update the new scheduler endpoint (this is what the VPS cron uses)
      await fetch(mcUrl + '/api/campaigns/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: 'ig_ugc', enabled: newEnabled, hour_utc: autoPost.hourUtc, scenario: autoPost.scenario }),
      });
      // Also update legacy state for backward compat
      const res = await fetch(mcUrl + '/api/instagram/auto-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled, hourUtc: autoPost.hourUtc }),
      });
      const data = await res.json();
      if (data.state) {
        setAutoPost(prev => ({ ...prev, enabled: data.state.enabled, hourUtc: data.state.hourUtc || prev.hourUtc }));
      }
      showToast('ok', newEnabled ? 'Auto-post enabled — runs daily at ' + autoPost.hourUtc + ':00 UTC' : 'Auto-post disabled');
    } catch {
      showToast('error', 'Connection error');
    }
    setLoadingAuto(false);
  };

  const handleScenarioChange = (scenario: 'A' | 'B') => {
    setAutoPost(prev => ({ ...prev, scenario }));
    // Persist scenario to scheduler
    fetch(mcUrl + '/api/campaigns/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: 'ig_ugc', enabled: autoPost.enabled, hour_utc: autoPost.hourUtc, scenario }),
    });
    showToast('ok', `Scenario ${scenario}: ${scenario === 'A' ? 'Same video to all accounts' : 'Different video per account'}`);
  };

  const handleScheduleChange = (hourUtc: number) => {
    setAutoPost(prev => ({ ...prev, hourUtc }));
    // Persist hour to scheduler
    fetch(mcUrl + '/api/campaigns/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: 'ig_ugc', enabled: autoPost.enabled, hour_utc: hourUtc, scenario: autoPost.scenario }),
    });
  };

  const handleManualGenerate = async () => {
    if (manualRunning) return;
    setManualRunning(true);
    setRunState(prev => ({ ...prev, status: 'generating', error: null, heyGenComplete: false, igComplete: false, totalPosts: 0 }));
    try {
      const res = await fetch(mcUrl + '/api/instagram/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: autoPost.scenario }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('ok', 'Video generation started');
      } else {
        showToast('error', data.error || 'Failed to start');
      }
    } catch {
      showToast('error', 'Connection error');
    }
    setTimeout(() => setManualRunning(false), 2000);
  };

  const scenarios = [
    { id: 'A' as const, title: 'Scenario A', sub: 'Same video posted to all accounts' },
    { id: 'B' as const, title: 'Scenario B', sub: 'Different video per account' },
  ];

  const isRunning = runState.status === 'generating' || runState.status === 'posting';
  const hourLabels = [
    { h: 6, label: '6 AM' }, { h: 7, label: '7 AM' }, { h: 8, label: '8 AM' },
    { h: 9, label: '9 AM' }, { h: 10, label: '10 AM' }, { h: 11, label: '11 AM' },
    { h: 12, label: '12 PM' }, { h: 13, label: '1 PM' }, { h: 14, label: '2 PM' },
    { h: 15, label: '3 PM' }, { h: 16, label: '4 PM' }, { h: 17, label: '5 PM' },
    { h: 18, label: '6 PM' }, { h: 19, label: '7 PM' }, { h: 20, label: '8 PM' },
  ];

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Instagram UGC</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
            <Instagram size={12} style={{ color: ACCENT }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{accounts.length} Accounts</span>
          </div>
        </div>
      </div>

      {/* Warmup control panel — only shown on IG UGC page */}
      {accounts.length > 0 && (
        <div style={{ margin: '0 24px 20px' }}>
          {(() => {
            const accountsData = accounts;
            const warmedCount = accountsData.filter(a => a.warmup_completed || (a.warmup_days_completed || 0) >= 7).length;
            const inProgressCount = accountsData.filter(a => a.warmup_days_completed && (a.warmup_days_completed || 0) < 7 && !a.warmup_completed).length;
            const neverCount = accountsData.filter(a => !a.warmup_days_completed || a.warmup_days_completed === 0).length;
            const allWarmed = warmedCount === accountsData.length && accountsData.length > 0;

            if (allWarmed) {
              return (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldCheck size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginBottom: 2 }}>All accounts warmed up</div>
                    <div style={{ fontSize: '11.5px', color: 'rgba(16,185,129,0.7)' }}>{warmedCount}/{accountsData.length} accounts complete — campaigns unlocked</div>
                  </div>
                </div>
              );
            }

            return (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#a78bfa18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={16} style={{ color: '#a78bfa' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>Instagram Warmup</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>7 days per account — auto-warms daily</div>
                    </div>
                  </div>
                  {/* Status badge */}
                  {warmedCount > 0 ? (
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.25)' }}>
                      {warmedCount}/{accountsData.length} Ready
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(245,158,11,0.25)' }}>
                      Not Started
                    </div>
                  )}
                </div>

                {/* Progress stats */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#a78bfa', lineHeight: 1 }}>{warmedCount}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, marginTop: 3 }}>COMPLETE</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{inProgressCount}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, marginTop: 3 }}>IN PROGRESS</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-3)', lineHeight: 1 }}>{neverCount}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, marginTop: 3 }}>NOT STARTED</div>
                  </div>
                </div>

                {/* Block warning */}
                {warmedCount === 0 && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-3)', background: 'var(--surface-2)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <AlertCircle size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span>Accounts need 7-day warmup before campaigns can run. Enable auto-warmup below.</span>
                  </div>
                )}

                {/* Account rows with auto-warmup toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {accountsData.map(acc => {
                    const days = acc.warmup_days_completed || 0;
                    const done = acc.warmup_completed || days >= 7;
                    const inProgress = days > 0 && !done;
                    return (
                      <div key={acc.id} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Account info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name || acc.username || acc.id}</div>
                          {!done && (
                            <div style={{ display: 'flex', gap: 3 }}>
                              {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} style={{ width: 18, height: 4, borderRadius: 2, background: i < days ? '#a78bfa' : 'var(--border)' }} />
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Day badge */}
                        {done ? (
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 99 }}>Done</div>
                        ) : (
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa' }}>Day {days}/7</div>
                        )}
                        {/* Toggle + run button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {!done && (
                            <RunWarmupBtn profileId={acc.adspower_id || acc.id} mcUrl={mcUrl} onDone={() => fetchWarmupSchedule(mcUrl)} />
                          )}
                          <WarmupToggle profileId={acc.adspower_id || acc.id} enabled={!!(warmupSched || {})[acc.adspower_id || acc.id]?.enabled} mcUrl={mcUrl} done={done} onToggle={() => fetchWarmupSchedule(mcUrl)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>HeyGen + Instagram</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Auto-generate UGC videos and post to Instagram â€” independent from TikTok</div>
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: toast.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: '1px solid ' + (toast.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'), fontSize: '12.5px', fontWeight: 600, color: toast.type === 'ok' ? '#10b981' : '#ef4444' }}>
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-post toggle card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Auto-Post to Instagram</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>HeyGen generates video daily at scheduled hour â€” auto-posts to all IG accounts</div>
            </div>
            <button
              onClick={handleAutoPostToggle}
              disabled={loadingAuto}
              style={{
                width: 46, height: 26, borderRadius: 99, border: 'none', cursor: loadingAuto ? 'not-allowed' : 'pointer',
                background: autoPost.enabled ? '#10b981' : 'var(--surface-3)',
                transition: 'background 0.2s', position: 'relative', flexShrink: 0,
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3,
                transition: 'left 0.2s',
                left: autoPost.enabled ? 23 : 3,
              }} />
            </button>
          </div>

          {/* Schedule hour */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Daily Post Hour (UTC)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {hourLabels.map(({ h, label }) => (
                <button key={h} onClick={() => handleScheduleChange(h)}
                  style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid ' + (autoPost.hourUtc === h ? ACCENT : 'var(--border-2)'), background: autoPost.hourUtc === h ? ACCENT + '18' : 'transparent', fontSize: '11.5px', fontWeight: 600, color: autoPost.hourUtc === h ? ACCENT : 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario picker */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Posting Scenario</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {scenarios.map((s) => (
                <div key={s.id} onClick={() => handleScenarioChange(s.id)}
                  style={{
                    padding: '11px 14px', borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid ' + (autoPost.scenario === s.id ? ACCENT : 'var(--border-2)'),
                    background: autoPost.scenario === s.id ? ACCENT + '10' : 'var(--surface-2)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: autoPost.scenario === s.id ? ACCENT : 'var(--text)', marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { icon: <Instagram size={14} />, val: accounts.length.toString(), label: 'IG Accounts', accent: ACCENT },
            { icon: <Video size={14} />, val: runState.heyGenComplete ? 'âœ“' : (runState.status === 'generating' ? Math.round(runState.heyGenProgress) + '%' : 'â€”'), label: 'Video Generated', accent: '#8b5cf6' },
            { icon: <CheckCircle size={14} />, val: runState.igComplete ? runState.totalPosts.toString() : 'â€”', label: 'Posted', accent: '#10b981' },
            { icon: <Clock size={14} />, val: autoPost.enabled ? `${autoPost.hourUtc}:00 UTC` : 'Off', label: 'Schedule', accent: '#f59e0b' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ color: s.accent }}>{s.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-1px', color: s.val === 'â€”' || s.val === 'Off' ? 'var(--text-3)' : 'var(--text)' }}>{s.val}</div>
            </motion.div>
          ))}
        </div>

        {/* Manual trigger + live status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Live Status</div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: isRunning ? '#10b981' : runState.error ? '#ef4444' : 'var(--text-3)', boxShadow: isRunning ? '0 0 8px #10b981' : 'none' }} />
            </div>
            {isRunning && (
              <button onClick={() => setRunState(prev => ({ ...prev, status: 'idle', error: null }))}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-2)', background: 'transparent', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Square size={11} /> Stop
              </button>
            )}
          </div>

          <div style={{ padding: '16px 18px' }}>
            {/* Phase progress */}
            {(isRunning || runState.error) && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                    {runState.status === 'generating' ? 'ðŸŽ¬ Generating video via HeyGen...' : 'ðŸ“¤ Posting to Instagram...'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>
                    {runState.status === 'generating' ? Math.round(runState.heyGenProgress) + '%' : Math.round(runState.igProgress) + '%'}
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: (runState.status === 'generating' ? runState.heyGenProgress : runState.igProgress) + '%', background: runState.status === 'generating' ? '#8b5cf6' : ACCENT, borderRadius: 99, transition: 'width 0.5s' }} />
                </div>
              </div>
            )}

            {/* Error */}
            {runState.error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 12, fontSize: '12.5px', color: '#ef4444', fontWeight: 600 }}>
                <AlertCircle size={13} style={{ display: 'inline', marginRight: 6 }} />
                {runState.error}
              </div>
            )}

            {/* Done state */}
            {runState.status === 'done' && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: 12, fontSize: '12.5px', color: '#10b981', fontWeight: 600 }}>
                <CheckCircle size={13} style={{ display: 'inline', marginRight: 6 }} />
                {runState.totalPosts} post{runState.totalPosts !== 1 ? 's' : ''} published to Instagram
              </div>
            )}

            {/* Idle state */}
            {runState.status === 'idle' && !runState.error && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ color: 'var(--text-3)', fontSize: '13px', marginBottom: 12 }}>
                  {autoPost.enabled ? 'Auto-post is active â€” next run at ' + autoPost.hourUtc + ':00 UTC' : 'Auto-post is off â€” trigger manually below'}
                </div>
              </div>
            )}

            {/* Manual trigger button */}
            <button
              onClick={handleManualGenerate}
              disabled={manualRunning || isRunning}
              style={{
                width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none',
                background: isRunning ? 'var(--surface-3)' : ACCENT, color: isRunning ? 'var(--text-3)' : 'white',
                fontSize: '13px', fontWeight: 700, cursor: isRunning ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'all 0.15s',
              }}
            >
              {isRunning ? (
                <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Running...</>
              ) : manualRunning ? (
                <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Starting...</>
              ) : (
                <><Zap size={14} /> Generate & Post Now</>
              )}
            </button>
          </div>
        </motion.div>

        {/* IG Accounts list */}
        {accounts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginTop: 14 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>IG Accounts</div>
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {accounts.map((acc) => (
                <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: ACCENT + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Instagram size={14} style={{ color: ACCENT }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>@{acc.username}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{acc.days_active || 0} days active · limit {acc.current_daily_limit || '?'}/day</div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: acc.status === 'active' ? '#10b981' : '#f59e0b' }} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Per-account warmup controls (IG UGC page only) ─────────────────────────
type WarmupStatus = 'idle' | 'running' | 'done' | 'error';

function WarmupToggle({ profileId, enabled, mcUrl, done, onToggle }: {
  profileId: string; enabled: boolean; mcUrl: string; done: boolean; onToggle: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading || done) return;
    setLoading(true);
    try {
      const next = !enabled;
      await fetch(mcUrl + '/api/ig/warmup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, enabled: next }),
      });
      onToggle();
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <button onClick={toggle} disabled={loading || done}
      style={{ width: 40, height: 22, borderRadius: 99, border: 'none', cursor: loading || done ? 'not-allowed' : 'pointer',
        background: done ? 'rgba(16,185,129,0.15)' : enabled ? '#a78bfa' : 'var(--surface-3)',
        transition: 'background 0.2s', position: 'relative', flexShrink: 0, opacity: loading ? 0.6 : 1 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: done ? '#10b981' : 'white', position: 'absolute', top: 3, transition: 'left 0.2s', left: done ? 18 : enabled ? 20 : 3 }} />
    </button>
  );
}

function RunWarmupBtn({ profileId, mcUrl, onDone }: {
  profileId: string; mcUrl: string; onDone: () => void;
}) {
  const [status, setStatus] = useState<WarmupStatus>('idle');
  const [msg, setMsg] = useState('');

  const runWarmup = async () => {
    if (!confirm('Start 15-min warmup session for this account?\n\nWill open Instagram Explore, like ~30 posts. Instagram may flag if done too fast.')) return;
    setStatus('running');
    setMsg('');
    try {
      const res = await fetch(mcUrl + '/api/ig/warmup/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, duration_min: 15 }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('done');
        setMsg('Session started — completes in ~15 min');
      } else {
        setStatus('error');
        setMsg(data.error || 'Failed');
      }
    } catch (e: any) {
      setStatus('error');
      setMsg(e?.message || 'Connection failed');
    }
    setTimeout(() => setStatus('idle'), 8000);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={runWarmup}
        disabled={status === 'running'}
        style={{
          height: 26, borderRadius: 6, border: 'none', cursor: status === 'running' ? 'not-allowed' : 'pointer',
          background: status === 'done' ? 'rgba(16,185,129,0.15)' : status === 'error' ? 'rgba(239,68,68,0.1)' : '#a78bfa18',
          color: status === 'done' ? '#10b981' : status === 'error' ? '#ef4444' : '#a78bfa',
          fontSize: 11, fontWeight: 700, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4,
          transition: 'all 0.2s', fontFamily: 'inherit',
        }}
      >
        {status === 'running' ? (
          <><Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> Running...</>
        ) : status === 'done' ? (
          <><CheckCircle size={10} /> Done</>
        ) : status === 'error' ? (
          <><AlertCircle size={10} /> Retry</>
        ) : (
          <>▶ Warmup</>
        )}
      </button>
      {msg && <span style={{ fontSize: 10, color: status === 'error' ? '#ef4444' : 'var(--text-3)', maxWidth: 120 }}>{msg}</span>}
    </div>
  );
}

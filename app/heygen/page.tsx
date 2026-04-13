'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Video, Clock, Plug, Plus, Play, X, CheckCircle, AlertCircle, Download, Zap } from 'lucide-react';

const ACCENT = '#8b5cf6';
const MC = 'http://127.0.0.1:3337';

interface HeyGenVideo {
  name: string;
  created: string;
  size: string;
  destination?: string;
  status?: string;
}

interface UGCStatus {
  status: string;
  phase: string | null;
  phaseLabel: string | null;
  heyGenComplete: boolean;
  heyGenProgress: number;
  heyGenStep: string | null;
  tiktokComplete: boolean;
  tiktokProgress: number;
}

export default function HeyGenPage() {
  const [videos, setVideos] = useState<HeyGenVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [ugcStatus, setUgcStatus] = useState<UGCStatus | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('tt_ugc_fitness');
  const [script, setScript] = useState('');

  const showToast = (type: 'ok' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(MC + '/api/heygen/videos');
      const data = await res.json();
      setVideos(data.videos || []);
    } catch {}
    setLoading(false);
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(MC + '/api/ugc/status');
      const data = await res.json();
      setUgcStatus(data);
      if (data.status === 'idle') setGenerating(false);
    } catch {}
  }, []);

  useEffect(() => {
    loadVideos();
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [loadVideos, checkStatus]);

  const startGeneration = async () => {
    if (script.trim()) {
      // Save script first
      try {
        await fetch(MC + '/api/ugc/set-scenario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: selectedScenario, script }),
        });
      } catch {}
    }
    setGenerating(true);
    try {
      const res = await fetch(MC + '/api/ugc/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: selectedScenario }),
      });
      const data = await res.json();
      if (data.success === false) showToast('error', data.error || 'Failed to start');
      else showToast('ok', 'Generation started');
    } catch { showToast('error', 'Could not reach MC server'); }
  };

  const connected = videos.length > 0 || (ugcStatus && ugcStatus.status !== 'idle');

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">HeyGen</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#22c55e' : 'var(--text-3)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              {connected ? 'Ready' : 'Not connected'}
            </span>
          </div>
          <button onClick={() => setShowGenerate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'white', fontFamily: 'inherit' }}>
            <Wand2 size={12} /> Generate
          </button>
        </div>
      </div>

      <div className="page-content">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', top: 80, right: 20, zIndex: 9999,
                background: toast.type === 'ok' ? '#166534' : '#991b1b',
                color: 'white', padding: '10px 18px', borderRadius: 8,
                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}>
              {toast.type === 'ok' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>AI Video Generation</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Create avatar videos from scripts, then send to IG or TikTok</div>
        </motion.div>

        {/* Generation progress banner */}
        <AnimatePresence>
          {generating && ugcStatus && ugcStatus.status !== 'idle' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={13} /> Generating video...
                </div>
                <button onClick={() => { setGenerating(false); setUgcStatus({ status: 'idle', phase: null, phaseLabel: null, heyGenComplete: false, heyGenProgress: 0, heyGenStep: null, tiktokComplete: false, tiktokProgress: 0 }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={14} /></button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: 6 }}>{ugcStatus.phaseLabel || ugcStatus.heyGenStep || ugcStatus.phase || 'Working...'}</div>
              <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: (ugcStatus.heyGenProgress || 0) + '%' }}
                  style={{ height: '100%', background: ACCENT, borderRadius: 99, transition: 'width 0.3s' }} />
              </div>
              {ugcStatus.tiktokComplete && (
                <div style={{ marginTop: 6, fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>TikTok posted successfully</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left — Videos + Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Quick create */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 14 }}>Quick Create</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Script → Video', sub: 'Write or paste script', icon: <Wand2 size={14} />, action: () => setShowGenerate(true) },
                  { label: 'Use Template', sub: 'Pre-built layouts', icon: <Video size={14} />, disabled: true },
                  { label: 'Auto-Post Setup', sub: 'Schedule daily posts', icon: <Clock size={14} />, disabled: true },
                ].map((t) => (
                  <button key={t.label} onClick={t.disabled ? undefined : t.action} style={{ padding: '14px', background: t.disabled ? 'var(--surface-2)' : 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: t.disabled ? 'not-allowed' : 'pointer', opacity: t.disabled ? 0.5 : 1 }}>
                    <div style={{ color: ACCENT, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{t.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-4)' }}>{t.sub}</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Videos list */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Generated Videos</div>
              </div>
              <div style={{ padding: '16px' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)', fontSize: '13px' }}>Loading...</div>
                ) : videos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>No videos yet</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: 16 }}>Generate your first video to get started</div>
                    <button onClick={() => setShowGenerate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
                      <Wand2 size={13} /> Generate Video
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {videos.slice(0, 20).map((v, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={16} style={{ color: ACCENT }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{v.name}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-4)' }}>{v.size} &middot; {new Date(v.created).toLocaleDateString()}</div>
                          </div>
                        </div>
                        {v.destination && (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '10px', fontWeight: 700, background: 'rgba(139,92,246,0.1)', color: ACCENT, border: '1px solid rgba(139,92,246,0.2)' }}>
                            {v.destination}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Created', val: videos.length, sub: 'All time' },
                { label: 'Ready', val: videos.filter(v => v.status !== 'pending').length, sub: 'To use' },
                { label: 'In Queue', val: generating ? 1 : 0, sub: 'Processing' },
                { label: 'Credits', val: '—', sub: 'Available' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>{s.val}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-4)', marginTop: 1 }}>{s.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Destinations */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Destinations</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {[
                  { name: 'TikTok', sub: 'Auto-send after生成', active: false },
                  { name: 'Instagram Reels', sub: 'Auto-send after生成', active: false },
                ].map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>{d.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{d.sub}</div>
                    </div>
                    <div style={{ width: 36, height: 20, borderRadius: 99, background: 'var(--surface-3)', position: 'relative', cursor: 'not-allowed' }}>
                      <div style={{ position: 'absolute', left: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'var(--text-3)' }} />
                    </div>
                  </div>
                ))}
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

        {/* Generate Modal */}
        <AnimatePresence>
          {showGenerate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowGenerate(false); }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>Generate Video</div>
                  <button onClick={() => setShowGenerate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>Scenario</div>
                    <select value={selectedScenario} onChange={e => setSelectedScenario(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit' }}>
                      <option value="tt_ugc_fitness">TikTok UGC - Fitness</option>
                      <option value="tt_ugc_realestate">TikTok UGC - Real Estate</option>
                      <option value="tt_ugc_coaching">TikTok UGC - Coaching</option>
                      <option value="ig_ugc_lifestyle">Instagram UGC - Lifestyle</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>Script (optional — leave blank to auto-generate)</div>
                    <textarea value={script} onChange={e => setScript(e.target.value)} rows={6}
                      placeholder="Enter your video script here, or leave blank and the system will generate one automatically based on your client config..."
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={startGeneration} style={{ padding: '10px', background: ACCENT, border: 'none', borderRadius: 6, color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Wand2 size={13} style={{ display: 'inline', marginRight: 6 }} /> Start Generation
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

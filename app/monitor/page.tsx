'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getMcUrl } from '@/lib/mc-url';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Trash2, TrendingUp, TrendingDown, Minus,
  Globe, Star, Users, Rss, AlertCircle, CheckCircle,
  Loader2, RefreshCw, ChevronDown, ExternalLink, MessageSquare
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface MonitorKeyword {
  id: string;
  keyword: string;
  target_url: string | null;
  search_volume: number | null;
  created_at: string;
}

interface MonitorRanking {
  id: string;
  keyword: string;
  keyword_id: string | null;
  position: number | null;
  search_engine: string;
  searched_at: string;
}

interface MonitorMention {
  id: string;
  source: string;
  source_url: string | null;
  title: string | null;
  snippet: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  found_at: string;
  alert_sent: boolean;
}

interface MonitorReview {
  id: string;
  platform: string;
  platform_review_id: string | null;
  reviewer_name: string | null;
  rating: number | null;
  review_text: string | null;
  review_url: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface MonitorCompetitor {
  id: string;
  name: string;
  domain: string | null;
  social_handles: Record<string, string>;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sentimentColor(s: string) {
  if (s === 'positive') return '#10b981';
  if (s === 'negative') return '#ef4444';
  return '#6b7280';
}

function sentimentIcon(s: string) {
  if (s === 'positive') return <TrendingUp size={14} />;
  if (s === 'negative') return <TrendingDown size={14} />;
  return <Minus size={14} />;
}

function platformColor(p: string) {
  if (p === 'google') return '#4285f4';
  if (p === 'yelp') return '#c41200';
  if (p === 'trustpilot') return '#00b67a';
  if (p === 'g2') return '#7b36d4';
  if (p === 'reddit') return '#ff4500';
  if (p === 'google_news') return '#f43f5e';
  return '#6b7280';
}

function platformIcon(p: string) {
  if (p === 'google' || p === 'google_news') return <Search size={12} />;
  if (p === 'yelp') return <Globe size={12} />;
  if (p === 'trustpilot') return <Star size={12} />;
  if (p === 'g2') return <Users size={12} />;
  if (p === 'reddit') return <MessageSquare size={12} />;
  return <Rss size={12} />;
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MonitorPage() {
  const [user, setUser] = useState<any>(null);
  const [mcUrl, setMcUrl] = useState('http://127.0.0.1:3337');
  const [tab, setTab] = useState<'keywords' | 'rankings' | 'mentions' | 'reviews' | 'competitors'>('keywords');
  const [loading, setLoading] = useState(true);

  // Keywords
  const [keywords, setKeywords] = useState<MonitorKeyword[]>([]);
  const [newKw, setNewKw] = useState('');
  const [newKwUrl, setNewKwUrl] = useState('');
  const [addingKw, setAddingKw] = useState(false);

  // Rankings
  const [rankings, setRankings] = useState<MonitorRanking[]>([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankFilter, setRankFilter] = useState('');

  // Mentions
  const [mentions, setMentions] = useState<MonitorMention[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  // Reviews
  const [reviews, setReviews] = useState<MonitorReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Competitors
  const [competitors, setCompetitors] = useState<MonitorCompetitor[]>([]);
  const [newComp, setNewComp] = useState({ name: '', domain: '' });
  const [addingComp, setAddingComp] = useState(false);

  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      setUser(user);
      const url = await getMcUrl();
      setMcUrl(url);
    })();
  }, []);

  // ─── Load Keywords ────────────────────────────────────────────────────────
  const loadKeywords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${mcUrl}/api/monitor/keywords`);
      if (!res.ok) throw new Error('Failed to load keywords');
      const data = await res.json();
      setKeywords(Array.isArray(data) ? data : (data.value || []));
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally { setLoading(false); }
  }, [user, mcUrl]);

  useEffect(() => { if (user) loadKeywords(); }, [user, loadKeywords]);

  // ─── Add Keyword ───────────────────────────────────────────────────────────
  const addKeyword = async () => {
    if (!newKw.trim()) return;
    setAddingKw(true); setMsg(null);
    try {
      const res = await fetch(`${mcUrl}/api/monitor/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKw.trim(), target_url: newKwUrl.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add keyword');
      setKeywords(prev => [data, ...prev]);
      setNewKw(''); setNewKwUrl('');
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally { setAddingKw(false); }
  };

  // ─── Delete Keyword ───────────────────────────────────────────────────────
  const deleteKeyword = async (id: string) => {
    try {
      const res = await fetch(`${mcUrl}/api/monitor/keywords/${id}/delete`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setKeywords(prev => prev.filter(k => k.id !== id));
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  // ─── Load Rankings ────────────────────────────────────────────────────────
  const loadRankings = useCallback(async () => {
    if (!user) return;
    setRankLoading(true);
    try {
      const p = new URLSearchParams({ limit: '200' });
      if (rankFilter) p.set('keyword', rankFilter);
      const res = await fetch(`${mcUrl}/api/monitor/rankings?${p}`);
      const data = await res.json();
      setRankings(Array.isArray(data) ? data : (data.value || []));
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setRankLoading(false); }
  }, [user, mcUrl, rankFilter]);

  // ─── Load Mentions ───────────────────────────────────────────────────────
  const loadMentions = useCallback(async () => {
    if (!user) return;
    setMentionLoading(true);
    try {
      const p = new URLSearchParams({ limit: '100' });
      if (mentionFilter) p.set('source', mentionFilter);
      const res = await fetch(`${mcUrl}/api/monitor/mentions?${p}`);
      const data = await res.json();
      setMentions(Array.isArray(data) ? data : (data.value || []));
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setMentionLoading(false); }
  }, [user, mcUrl, mentionFilter]);

  // ─── Load Reviews ─────────────────────────────────────────────────────────
  const loadReviews = useCallback(async () => {
    if (!user) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`${mcUrl}/api/monitor/reviews`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : (data.value || []));
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setReviewLoading(false); }
  }, [user, mcUrl]);

  // ─── Load Competitors ────────────────────────────────────────────────────
  const loadCompetitors = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${mcUrl}/api/monitor/competitors`);
      const data = await res.json();
      setCompetitors(Array.isArray(data) ? data : (data.value || []));
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
  }, [user, mcUrl]);

  // ─── Add Competitor ───────────────────────────────────────────────────────
  const addCompetitor = async () => {
    if (!newComp.name.trim()) return;
    setAddingComp(true);
    try {
      const res = await fetch(`${mcUrl}/api/monitor/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newComp.name.trim(), domain: newComp.domain.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add competitor');
      setCompetitors(prev => [data, ...prev]);
      setNewComp({ name: '', domain: '' });
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setAddingComp(false); }
  };

  // ─── Tab switching ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (tab === 'rankings') loadRankings();
    if (tab === 'mentions') loadMentions();
    if (tab === 'reviews') loadReviews();
    if (tab === 'competitors') loadCompetitors();
  }, [tab, user]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const kwWithLatestRank = keywords.map(kw => {
    const kwRanks = rankings.filter(r => r.keyword === kw.keyword).sort((a, b) =>
      new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime()
    );
    return { ...kw, latestRank: kwRanks[0]?.position ?? null, rankHistory: kwRanks };
  });

  const avgRating = (reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.filter(r => r.rating).length).toFixed(1) : '–');

  const TABS = [
    { key: 'keywords',    label: 'Keywords',      icon: <Search size={14} /> },
    { key: 'rankings',    label: 'Rankings',       icon: <TrendingUp size={14} /> },
    { key: 'mentions',    label: 'Mentions',       icon: <Rss size={14} /> },
    { key: 'reviews',      label: 'Reviews',        icon: <Star size={14} /> },
    { key: 'competitors', label: 'Competitors',    icon: <Users size={14} /> },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>SEO / Brand Monitor</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
              Track keyword rankings, brand mentions, reviews & competitors
            </p>
          </div>
          <button
            onClick={() => tab === 'keywords' ? loadKeywords() : tab === 'rankings' ? loadRankings() : tab === 'mentions' ? loadMentions() : tab === 'reviews' ? loadReviews() : loadCompetitors()}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
                fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
                background: tab === t.key ? '#f43f5e' : 'rgba(255,255,255,0.05)',
                color: tab === t.key ? '#fff' : '#9ca3af',
                transition: 'all 0.15s',
              }}
            >
              {t.icon} {t.label}
              {t.key === 'keywords' && keywords.length > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{keywords.length}</span>
              )}
              {t.key === 'mentions' && mentions.length > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{mentions.length}</span>
              )}
              {t.key === 'reviews' && reviews.length > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{reviews.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Message ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ margin: '16px 32px', padding: '12px 16px', borderRadius: 10, fontSize: 13,
              background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
              color: msg.type === 'error' ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
            {msg.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Content ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 32px' }}>

        {/* ── KEYWORDS ─────────────────────────────────────────────────────── */}
        {tab === 'keywords' && (
          <div>
            {/* Add keyword */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
              <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 12px' }}>Add a new keyword to track</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newKw} onChange={e => setNewKw(e.target.value)} placeholder="e.g. social media automation software"
                  onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }} />
                <input value={newKwUrl} onChange={e => setNewKwUrl(e.target.value)} placeholder="Target URL (optional)"
                  onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  style={{ width: 240, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }} />
                <button onClick={addKeyword} disabled={addingKw || !newKw.trim()}
                  style={{ background: '#f43f5e', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: addingKw ? 'not-allowed' : 'pointer', opacity: addingKw ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {addingKw ? <Loader2 size={13} style={{ animation: 'spin' }} /> : <Plus size={14} />} Add
                </button>
              </div>
            </div>

            {/* Keywords list */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}><Loader2 size={24} style={{ animation: 'spin' }} /></div>
            ) : keywords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#4b5563' }}>
                <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 15, margin: '0 0 6px' }}>No keywords tracked yet</p>
                <p style={{ fontSize: 13, margin: 0 }}>Add keywords above to start monitoring rankings</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {kwWithLatestRank.map(kw => (
                  <div key={kw.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{kw.keyword}</div>
                      {kw.target_url && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{kw.target_url}</div>}
                      <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>Added {timeAgo(kw.created_at)}</div>
                    </div>
                    {kw.latestRank ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {kw.latestRank <= 3 ? (
                          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>#{kw.latestRank}</span>
                        ) : kw.latestRank <= 10 ? (
                          <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>#{kw.latestRank}</span>
                        ) : (
                          <span style={{ background: 'rgba(107,114,128,0.15)', color: '#9ca3af', borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>#{kw.latestRank}</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#4b5563', fontSize: 12 }}>No ranking data</span>
                    )}
                    <button onClick={() => deleteKeyword(kw.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RANKINGS ──────────────────────────────────────────────────────── */}
        {tab === 'rankings' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <input value={rankFilter} onChange={e => setRankFilter(e.target.value)} placeholder="Filter by keyword..."
                onKeyDown={e => e.key === 'Enter' && loadRankings()}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#fff', fontSize: 13, outline: 'none', width: 260 }} />
              <button onClick={loadRankings} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                <RefreshCw size={13} />
              </button>
            </div>

            {rankLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}><Loader2 size={24} style={{ animation: 'spin' }} /></div>
            ) : rankings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#4b5563' }}>
                <TrendingUp size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 15, margin: '0 0 6px' }}>No ranking data yet</p>
                <p style={{ fontSize: 13, margin: 0 }}>Rankings appear after keywords are tracked for a while</p>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 500 }}>Keyword</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 500 }}>Position</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 500 }}>Engine</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 500 }}>Last Checked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.slice(0, 100).map((r, i) => (
                      <tr key={r.id || i} style={{ borderBottom: i < rankings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <td style={{ padding: '11px 16px', color: '#e5e7eb' }}>{r.keyword}</td>
                        <td style={{ padding: '11px 16px' }}>
                          {r.position ? (
                            r.position <= 3 ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 6, padding: '3px 8px', fontWeight: 700 }}>#{r.position}</span>
                            : r.position <= 10 ? <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>#{r.position}</span>
                            : <span style={{ background: 'rgba(107,114,128,0.15)', color: '#9ca3af', borderRadius: 6, padding: '3px 8px' }}>#{r.position}</span>
                          ) : <span style={{ color: '#4b5563' }}>–</span>}
                        </td>
                        <td style={{ padding: '11px 16px', color: '#6b7280', fontSize: 12 }}>{r.search_engine}</td>
                        <td style={{ padding: '11px 16px', color: '#6b7280', fontSize: 12 }}>{timeAgo(r.searched_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── MENTIONS ─────────────────────────────────────────────────────── */}
        {tab === 'mentions' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <select value={mentionFilter} onChange={e => setMentionFilter(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#fff', fontSize: 13, outline: 'none' }}>
                <option value="">All sources</option>
                <option value="google_news">Google News</option>
                <option value="reddit">Reddit</option>
              </select>
              <button onClick={loadMentions} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#fff', cursor: 'pointer' }}>
                <RefreshCw size={13} />
              </button>
            </div>

            {mentionLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}><Loader2 size={24} style={{ animation: 'spin' }} /></div>
            ) : mentions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#4b5563' }}>
                <Rss size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 15, margin: '0 0 6px' }}>No mentions found</p>
                <p style={{ fontSize: 13, margin: 0 }}>Mentions appear when your brand is discussed online</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {mentions.map(m => (
                  <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: platformColor(m.source), marginTop: 2 }}>{platformIcon(m.source)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: platformColor(m.source), textTransform: 'uppercase' }}>{m.source.replace('_', ' ')}</span>
                          <span style={{ color: sentimentColor(m.sentiment), display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                            {sentimentIcon(m.sentiment)} {m.sentiment}
                          </span>
                          <span style={{ color: '#4b5563', fontSize: 11, marginLeft: 'auto' }}>{timeAgo(m.found_at)}</span>
                        </div>
                        {m.title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', marginBottom: 4 }}>{m.title}</div>}
                        {m.snippet && <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>{m.snippet}</div>}
                        {m.source_url && (
                          <a href={m.source_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#3b82f6', fontSize: 12, marginTop: 6, textDecoration: 'none' }}>
                            View source <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
        {tab === 'reviews' && (
          <div>
            {reviewLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}><Loader2 size={24} style={{ animation: 'spin' }} /></div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#4b5563' }}>
                <Star size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 15, margin: '0 0 6px' }}>No reviews tracked yet</p>
                <p style={{ fontSize: 13, margin: 0 }}>Reviews from Google, Yelp, Trustpilot & G2 will appear here</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24' }}>★ {avgRating}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    <div style={{ color: '#e5e7eb', fontWeight: 600 }}>{reviews.length} reviews tracked</div>
                    <div>Across Google, Yelp, Trustpilot, G2</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ background: platformColor(r.platform) + '22', color: platformColor(r.platform), borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{r.platform}</span>
                        {r.rating && (
                          <span style={{ color: '#fbbf24', fontSize: 13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        )}
                        <span style={{ color: '#4b5563', fontSize: 11, marginLeft: 'auto' }}>{r.reviewed_at ? timeAgo(r.reviewed_at) : ''}</span>
                      </div>
                      {r.reviewer_name && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>By {r.reviewer_name}</div>}
                      {r.review_text && <div style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5 }}>{r.review_text}</div>}
                      {r.review_url && (
                        <a href={r.review_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#3b82f6', fontSize: 12, marginTop: 6, textDecoration: 'none' }}>
                          View review <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMPETITORS ──────────────────────────────────────────────────── */}
        {tab === 'competitors' && (
          <div>
            {/* Add competitor */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
              <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 12px' }}>Add a competitor to monitor</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newComp.name} onChange={e => setNewComp(p => ({ ...p, name: e.target.value }))} placeholder="Company name"
                  onKeyDown={e => e.key === 'Enter' && addCompetitor()}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }} />
                <input value={newComp.domain} onChange={e => setNewComp(p => ({ ...p, domain: e.target.value }))} placeholder="Domain (e.g. hootsuite.com)"
                  onKeyDown={e => e.key === 'Enter' && addCompetitor()}
                  style={{ width: 240, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }} />
                <button onClick={addCompetitor} disabled={addingComp || !newComp.name.trim()}
                  style={{ background: '#f43f5e', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: addingComp ? 'not-allowed' : 'pointer', opacity: addingComp ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {addingComp ? <Loader2 size={13} style={{ animation: 'spin' }} /> : <Plus size={14} />} Add
                </button>
              </div>
            </div>

            {competitors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#4b5563' }}>
                <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 15, margin: '0 0 6px' }}>No competitors tracked yet</p>
                <p style={{ fontSize: 13, margin: 0 }}>Add competitors to monitor their online presence</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {competitors.map(c => (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{c.name}</div>
                        {c.domain && <div style={{ fontSize: 12, color: '#6b7280' }}>{c.domain}</div>}
                        {Object.keys(c.social_handles || {}).length > 0 && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            {Object.entries(c.social_handles || {}).map(([platform, handle]) => (
                              <span key={platform} style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>{platform}: {handle}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span style={{ color: '#4b5563', fontSize: 11 }}>{timeAgo(c.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* CSS spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #4b5563; }
        select option { background: #1a1a2e; }
      `}</style>
    </div>
  );
}
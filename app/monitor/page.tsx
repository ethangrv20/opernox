'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getMcUrl } from '@/lib/mc-url';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Trash2, TrendingUp, TrendingDown, Minus,
  Globe, Star, Users, Rss, AlertCircle, CheckCircle,
  Loader2, RefreshCw, ExternalLink, MessageSquare, X, BarChart2
} from 'lucide-react';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  rank?: number | null;
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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function sentimentColor(s: string) {
  if (s === 'positive') return '#10b981';
  if (s === 'negative') return '#ef4444';
  return '#6b7280';
}

function sentimentIcon(s: string) {
  if (s === 'positive') return <TrendingUp size={13} />;
  if (s === 'negative') return <TrendingDown size={13} />;
  return <Minus size={13} />;
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

// â”€â”€â”€ Keyword Details Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KeywordDetailsModal({
  keyword,
  rankings,
  mentions,
  reviews,
  loading,
  onClose,
  onCheckRankings,
  onScrapeMentions,
  onScrapeReviews,
  scrapeRankingsLoading,
  scrapeMentionsLoading,
  scrapeReviewsLoading,
  businessName,
}: {
  keyword: MonitorKeyword;
  rankings: MonitorRanking[];
  mentions: MonitorMention[];
  reviews: MonitorReview[];
  loading: boolean;
  onClose: () => void;
  onCheckRankings: () => void;
  onScrapeMentions: () => void;
  onScrapeReviews: () => void;
  scrapeRankingsLoading: boolean;
  scrapeMentionsLoading: boolean;
  scrapeReviewsLoading: boolean;
  businessName: string;
}) {
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.filter(r => r.rating).length).toFixed(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{
          background: '#13131f',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18,
          width: '100%',
          maxWidth: 820,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{keyword.keyword}</div>
            {keyword.target_url && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{keyword.target_url}</div>
            )}
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>Added {timeAgo(keyword.created_at)}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
            padding: 8, color: '#9ca3af', cursor: 'pointer', display: 'flex',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              <Loader2 size={28} style={{ animation: 'spin', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14 }}>Loading data...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 24 }}>

              {/* â”€â”€ RANKINGS â”€â”€ */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={15} style={{ color: '#3b82f6' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>Rankings</span>
                    {rankings.length > 0 && (
                      <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                        {rankings.length} result{rankings.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onCheckRankings}
                    disabled={scrapeRankingsLoading}
                    style={{
                      background: scrapeRankingsLoading ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.15)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      borderRadius: 8, padding: '7px 13px', color: scrapeRankingsLoading ? '#93c5fd' : '#3b82f6',
                      cursor: scrapeRankingsLoading ? 'not-allowed' : 'pointer', fontSize: 12,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {scrapeRankingsLoading ? <Loader2 size={11} style={{ animation: 'spin' }} /> : <Search size={11} />}
                    {scrapeRankingsLoading ? 'Checking...' : 'Check Rankings'}
                  </button>
                </div>

                {rankings.length === 0 ? (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '24px', textAlign: 'center', color: '#4b5563', fontSize: 13,
                  }}>
                    No ranking data yet. Click "Check Rankings" to see where this keyword ranks on Google.
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: 12 }}>#</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: 12 }}>Engine</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 500, fontSize: 12 }}>Last Checked</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankings.slice(0, 20).map((r, i) => (
                          <tr key={r.id || i} style={{ borderBottom: i < Math.min(rankings.length, 20) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <td style={{ padding: '9px 14px' }}>
                              {r.position ? (
                                r.position <= 3 ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 6, padding: '2px 7px', fontWeight: 700, fontSize: 12 }}>#{r.position}</span>
                                : r.position <= 10 ? <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 6, padding: '2px 7px', fontWeight: 600, fontSize: 12 }}>#{r.position}</span>
                                : <span style={{ background: 'rgba(107,114,128,0.15)', color: '#9ca3af', borderRadius: 6, padding: '2px 7px', fontSize: 12 }}>#{r.position}</span>
                              ) : r.rank ? (
                                r.rank <= 3 ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 6, padding: '2px 7px', fontWeight: 700, fontSize: 12 }}>#{r.rank}</span>
                                : r.rank <= 10 ? <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 6, padding: '2px 7px', fontWeight: 600, fontSize: 12 }}>#{r.rank}</span>
                                : <span style={{ background: 'rgba(107,114,128,0.15)', color: '#9ca3af', borderRadius: 6, padding: '2px 7px', fontSize: 12 }}>#{r.rank}</span>
                              ) : <span style={{ color: '#4b5563' }}>â€“</span>}
                            </td>
                            <td style={{ padding: '9px 14px', color: '#6b7280', fontSize: 12 }}>{r.search_engine}</td>
                            <td style={{ padding: '9px 14px', color: '#6b7280', fontSize: 12 }}>{timeAgo(r.searched_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rankings.length > 20 && (
                      <div style={{ padding: '10px 14px', fontSize: 12, color: '#4b5563', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        Showing 20 of {rankings.length} results
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* â”€â”€ MENTIONS â”€â”€ */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Rss size={15} style={{ color: '#f43f5e' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>Mentions</span>
                    {mentions.length > 0 && (
                      <span style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                        {mentions.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onScrapeMentions}
                    disabled={scrapeMentionsLoading}
                    style={{
                      background: scrapeMentionsLoading ? 'rgba(244,63,94,0.1)' : 'rgba(244,63,94,0.15)',
                      border: '1px solid rgba(244,63,94,0.3)',
                      borderRadius: 8, padding: '7px 13px', color: scrapeMentionsLoading ? '#fda4af' : '#f43f5e',
                      cursor: scrapeMentionsLoading ? 'not-allowed' : 'pointer', fontSize: 12,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {scrapeMentionsLoading ? <Loader2 size={11} style={{ animation: 'spin' }} /> : <Rss size={11} />}
                    {scrapeMentionsLoading ? 'Scanning...' : 'Find Mentions'}
                  </button>
                </div>

                {mentions.length === 0 ? (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '24px', textAlign: 'center', color: '#4b5563', fontSize: 13,
                  }}>
                    No mentions found for this keyword.
                    <div style={{ marginTop: 6, fontSize: 12, color: '#374151' }}>
                      Requires AdsPower browser running on your VPS.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {mentions.map(m => (
                      <div key={m.id} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 10, padding: '12px 14px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: platformColor(m.source), marginTop: 1 }}>{platformIcon(m.source)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: platformColor(m.source), textTransform: 'uppercase' }}>{m.source.replace('_', ' ')}</span>
                              <span style={{ color: sentimentColor(m.sentiment), display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                                {sentimentIcon(m.sentiment)} {m.sentiment}
                              </span>
                              <span style={{ color: '#4b5563', fontSize: 11, marginLeft: 'auto' }}>{timeAgo(m.found_at)}</span>
                            </div>
                            {m.title && <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 2 }}>{m.title}</div>}
                            {m.snippet && <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{m.snippet}</div>}
                            {m.source_url && (
                              <a href={m.source_url} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#3b82f6', fontSize: 11, marginTop: 5, textDecoration: 'none' }}>
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

              {/* â”€â”€ REVIEWS â”€â”€ */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Star size={15} style={{ color: '#fbbf24' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>Reviews</span>
                    {reviews.length > 0 && avgRating && (
                      <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                        {avgRating} avg Â· {reviews.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onScrapeReviews}
                    disabled={scrapeReviewsLoading}
                    style={{
                      background: scrapeReviewsLoading ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.15)',
                      border: '1px solid rgba(251,191,36,0.3)',
                      borderRadius: 8, padding: '7px 13px', color: scrapeReviewsLoading ? '#fde68a' : '#fbbf24',
                      cursor: scrapeReviewsLoading ? 'not-allowed' : 'pointer', fontSize: 12,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {scrapeReviewsLoading ? <Loader2 size={11} style={{ animation: 'spin' }} /> : <Star size={11} />}
                    {scrapeReviewsLoading ? 'Scraping...' : 'Check Reviews'}
                  </button>
                </div>

                {reviews.length === 0 ? (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '24px', textAlign: 'center', color: '#4b5563', fontSize: 13,
                  }}>
                    No reviews scraped yet. Click "Check Reviews" to scrape Google Places, Yelp & Trustpilot.
                    <div style={{ marginTop: 6, fontSize: 12, color: '#374151' }}>
                      Requires AdsPower browser running on your VPS.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {reviews.slice(0, 20).map(r => (
                      <div key={r.id} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 10, padding: '12px 14px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ background: platformColor(r.platform) + '22', color: platformColor(r.platform), borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{r.platform}</span>
                          {r.rating && (
                            <span style={{ color: '#fbbf24', fontSize: 12 }}>{'â˜…'.repeat(r.rating)}{'â˜†'.repeat(5 - r.rating)}</span>
                          )}
                          <span style={{ color: '#4b5563', fontSize: 11, marginLeft: 'auto' }}>{r.reviewed_at ? timeAgo(r.reviewed_at) : ''}</span>
                        </div>
                        {r.reviewer_name && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>By {r.reviewer_name}</div>}
                        {r.review_text && <div style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5 }}>{r.review_text}</div>}
                        {r.review_url && (
                          <a href={r.review_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#3b82f6', fontSize: 11, marginTop: 5, textDecoration: 'none' }}>
                            View review <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function MonitorPage() {
  const [user, setUser] = useState<any>(null);
  const [mainTab, setMainTab] = useState<'keywords' | 'competitors'>('keywords');
  const [loading, setLoading] = useState(true);

  // GSC
  const [gscData, setGscData] = useState<{ connected: boolean; propertyUrl?: string; keywords?: any[] } | null>(null);
  const [gscLoading, setGscLoading] = useState(false);

  const loadGscData = useCallback(async () => {
    if (!user) return;
    setGscLoading(true);
    try {
      const url = await getMcUrl();
      const res = await fetch(`${url}/api/gsc/data`);
      const data = await res.json();
      setGscData(data);
    } catch (e: any) {
      setGscData({ connected: false });
    } finally { setGscLoading(false); }
  }, [user]);

  // Keywords
  const [keywords, setKeywords] = useState<MonitorKeyword[]>([]);
  const [newKw, setNewKw] = useState('');
  const [newKwUrl, setNewKwUrl] = useState('');
  const [addingKw, setAddingKw] = useState(false);

  // Competitors
  const [competitors, setCompetitors] = useState<MonitorCompetitor[]>([]);
  const [newComp, setNewComp] = useState({ name: '', domain: '' });
  const [addingComp, setAddingComp] = useState(false);
  const [scrapeCompLoading, setScrapeCompLoading] = useState<string | null>(null);

  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [configComplete, setConfigComplete] = useState<boolean | null>(null);

  // â”€â”€â”€ Keyword modal state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [selectedKw, setSelectedKw] = useState<MonitorKeyword | null>(null);
  const [kwRankings, setKwRankings] = useState<MonitorRanking[]>([]);
  const [kwMentions, setKwMentions] = useState<MonitorMention[]>([]);
  const [kwReviews, setKwReviews] = useState<MonitorReview[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [scrapeRankingsLoading, setScrapeRankingsLoading] = useState(false);
  const [scrapeMentionsModalLoading, setScrapeMentionsModalLoading] = useState(false);
  const [scrapeReviewsModalLoading, setScrapeReviewsModalLoading] = useState(false);

  // â”€â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const url = await getMcUrl();
      try {
        const ccRes = await fetch(`${url}/api/client-config`);
        const ccData = await ccRes.json();
        if (ccData.client?.name) setBusinessName(ccData.client.name);
      } catch (_) {}
      try {
        const statusRes = await fetch(`${url}/api/client-config/status`);
        const statusData = await statusRes.json();
        setConfigComplete(!!statusData.complete);
      } catch (_) {}
      try {
        setLoading(true);
        const res = await fetch(`${url}/api/monitor/keywords`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setKeywords(Array.isArray(data) ? data : (data.value || []));
      } catch (e: any) {
        setMsg({ type: 'error', text: e.message });
      } finally { setLoading(false); }
      setUser(user);
      setTimeout(() => loadGscData(), 0);
    })();
  }, []);

  useEffect(() => {
    if (user) loadGscData();
  }, [user]);

  // â”€â”€â”€ Load functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadKeywords = async () => {
    if (!user) return;
    setLoading(true); setMsg(null);
    try {
      const url = await getMcUrl();
      const res = await fetch(`${url}/api/monitor/keywords`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setKeywords(Array.isArray(data) ? data : (data.value || []));
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const loadCompetitors = async () => {
    if (!user) return;
    try {
      const baseUrl = await getMcUrl();
      const res = await fetch(`${baseUrl}/api/monitor/competitors`);
      const data = await res.json();
      setCompetitors(Array.isArray(data) ? data : (data.value || []));
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
  };

  // â”€â”€â”€ Keyword actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addKeyword = async () => {
    if (!newKw.trim()) return;
    setAddingKw(true); setMsg(null);
    try {
      const url = await getMcUrl();
      const res = await fetch(`${url}/api/monitor/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKw.trim(), target_url: newKwUrl.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add keyword');
      setKeywords(prev => [data, ...prev]);
      setNewKw(''); setNewKwUrl('');
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setAddingKw(false); }
  };

  const deleteKeyword = async (id: string) => {
    try {
      const url = await getMcUrl();
      const res = await fetch(`${url}/api/monitor/keywords/${id}/delete`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setKeywords(prev => prev.filter(k => k.id !== id));
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
  };

  // â”€â”€â”€ Modal: open and load data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openKeywordModal = async (kw: MonitorKeyword) => {
    setSelectedKw(kw);
    setModalLoading(true);
    setKwRankings([]); setKwMentions([]); setKwReviews([]);
    try {
      const url = await getMcUrl();
      const [rankRes, mentionRes, reviewRes] = await Promise.all([
        fetch(`${url}/api/monitor/rankings?keyword=${encodeURIComponent(kw.keyword)}`),
        fetch(`${url}/api/monitor/mentions?limit=50`),
        fetch(`${url}/api/monitor/reviews`),
      ]);
      const [rankData, mentionData, reviewData] = await Promise.all([
        rankRes.json(),
        mentionRes.json(),
        reviewRes.json(),
      ]);
      const allRankings: MonitorRanking[] = Array.isArray(rankData) ? rankData : (rankData.value || []);
      const allMentions: MonitorMention[] = Array.isArray(mentionData) ? mentionData : (mentionData.value || []);
      const allReviews: MonitorReview[] = Array.isArray(reviewData) ? reviewData : (reviewData.value || []);

      setKwRankings(allRankings.filter(r => r.keyword === kw.keyword));
      setKwMentions(allMentions.filter((m: MonitorMention) =>
        m.title?.toLowerCase().includes(kw.keyword.toLowerCase()) ||
        m.snippet?.toLowerCase().includes(kw.keyword.toLowerCase())
      ));
      setKwReviews(allReviews);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally { setModalLoading(false); }
  };

  const closeKeywordModal = () => { setSelectedKw(null); };

  const handleCheckRankings = async () => {
    if (!selectedKw) return;
    setScrapeRankingsLoading(true); setMsg(null);
    try {
      const url = await getMcUrl();
      const res = await fetch(`${url}/api/monitor/scrape/ranks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword_id: selectedKw.id, keyword: selectedKw.keyword, target_url: selectedKw.target_url }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'ok', text: data.message || 'Rankings updated!' });
        const rankRes = await fetch(`${url}/api/monitor/rankings?keyword=${encodeURIComponent(selectedKw.keyword)}`);
        const rankData = await rankRes.json();
        const allRankings: MonitorRanking[] = Array.isArray(rankData) ? rankData : (rankData.value || []);
        setKwRankings(allRankings.filter(r => r.keyword === selectedKw.keyword));
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to check rankings' });
      }
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setScrapeRankingsLoading(false); }
  };

  const handleScrapeMentions = async () => {
    if (!selectedKw) return;
    setScrapeMentionsModalLoading(true); setMsg(null);
    try {
      const url = await getMcUrl();
      const res = await fetch(`${url}/api/monitor/scrape/mentions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: businessName || selectedKw.keyword }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'ok', text: data.message });
        const mentionRes = await fetch(`${url}/api/monitor/mentions?limit=50`);
        const mentionData = await mentionRes.json();
        const allMentions: MonitorMention[] = Array.isArray(mentionData) ? mentionData : (mentionData.value || []);
        setKwMentions(allMentions.filter((m: MonitorMention) =>
          m.title?.toLowerCase().includes(selectedKw.keyword.toLowerCase()) ||
          m.snippet?.toLowerCase().includes(selectedKw.keyword.toLowerCase())
        ));
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to find mentions' });
      }
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setScrapeMentionsModalLoading(false); }
  };

  const handleScrapeReviews = async () => {
    if (!selectedKw) return;
    setScrapeReviewsModalLoading(true); setMsg(null);
    try {
      const url = await getMcUrl();
      const res = await fetch(`${url}/api/monitor/scrape/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'google_places', business_name: businessName || 'Opernox' }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'ok', text: data.message });
        const reviewRes = await fetch(`${url}/api/monitor/reviews`);
        const reviewData = await reviewRes.json();
        const allReviews: MonitorReview[] = Array.isArray(reviewData) ? reviewData : (reviewData.value || []);
        setKwReviews(allReviews);
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to check reviews' });
      }
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setScrapeReviewsModalLoading(false); }
  };

  // â”€â”€â”€ Competitor actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addCompetitor = async () => {
    if (!newComp.name.trim()) return;
    setAddingComp(true);
    try {
      const url = await getMcUrl();
      const res = await fetch(`${url}/api/monitor/competitors`, {
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

  const scrapeCompetitor = async (c: MonitorCompetitor) => {
    if (scrapeCompLoading) return;
    setScrapeCompLoading(c.id); setMsg(null);
    try {
      const url = await getMcUrl();
      const res = await fetch(`${url}/api/monitor/scrape/competitors`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_id: c.id, name: c.name, domain: c.domain })
      });
      const data = await res.json();
      if (data.success) { setMsg({ type: 'ok', text: `Competitor ${c.name} checked` }); loadCompetitors(); }
      else setMsg({ type: 'error', text: data.error || 'Failed to check competitor' });
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setScrapeCompLoading(null); }
  };

  useEffect(() => {
    if (!user) return;
    if (mainTab === 'competitors') loadCompetitors();
  }, [mainTab, user]);

  const kwWithCounts = keywords.map(kw => { return { ...kw }; });

  const TABS = [
    { key: 'keywords', label: 'Keywords', icon: <Search size={14} /> },
    { key: 'competitors', label: 'Competitors', icon: <Users size={14} /> },
  ] as const;

  if (configComplete === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>â³</div>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Loading monitor...</p>
        </div>
      </div>
    );
  }

  if (!configComplete) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>ðŸ”’</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Setup required</h2>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
            Complete your Client Config before using SEO Monitor.
          </p>
          <button onClick={() => window.location.href = '/client-config'}
            style={{ background: '#06b6d4', border: 'none', borderRadius: 8, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Go to Client Config â†’
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>SEO / Brand Monitor</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Track keyword rankings, brand mentions & reviews</p>
            {businessName && <p style={{ color: '#10b981', fontSize: 12, margin: '4px 0 0' }}>Monitoring brand: <strong>{businessName}</strong></p>}
          </div>
          <button onClick={() => mainTab === 'keywords' ? loadKeywords() : loadCompetitors()}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setMainTab(t.key as typeof mainTab)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, background: mainTab === t.key ? '#f43f5e' : 'rgba(255,255,255,0.05)', color: mainTab === t.key ? '#fff' : '#9ca3af', transition: 'all 0.15s' }}>
              {t.icon} {t.label}
              {t.key === 'keywords' && keywords.length > 0 && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{keywords.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ margin: '16px 32px', padding: '12px 16px', borderRadius: 10, fontSize: 13, background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, color: msg.type === 'error' ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
            {msg.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: '24px 32px' }}>
        {mainTab === 'keywords' && (
          <div>
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

            {gscData?.connected && Array.isArray(gscData.keywords) && gscData.keywords.length > 0 && (
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Google Search Console</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{gscData.propertyUrl} Â· Last 28 days</div>
                  </div>
                  <button onClick={loadGscData} disabled={gscLoading}
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '5px 10px', color: '#10b981', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RefreshCw size={11} style={gscLoading ? { animation: 'spin' } : {}} /> Refresh
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {gscData.keywords.slice(0, 20).map((kw: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.keys?.[0]}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{Number(kw.clicks).toLocaleString()}</span> clicks Â·
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>{Number(kw.impressions).toLocaleString()}</span> impressions Â·
                          Avg position <span style={{ color: kw.position <= 3 ? '#10b981' : kw.position <= 10 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{Number(kw.position).toFixed(1)}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#4b5563', minWidth: 40, textAlign: 'right' }}>CTR {kw.ctr ? `${(kw.ctr * 100).toFixed(1)}%` : 'â€“'}</div>
                    </div>
                  ))}
                </div>
                {gscData.keywords.length > 20 && <div style={{ fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 10 }}>Showing top 20 of {gscData.keywords.length} keywords</div>}
              </div>
            )}

            {gscData?.connected && (!Array.isArray(gscData.keywords) || gscData.keywords.length === 0) && !gscLoading && (
              <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 14, padding: 18, marginBottom: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#f59e0b', marginBottom: 6 }}>Google Search Console connected â€” no keyword data yet</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Google takes 1â€“3 days to index a new property.</div>
              </div>
            )}

            {!gscData?.connected && !gscLoading && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, marginBottom: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>Google Search Console not connected</div>
                <div style={{ fontSize: 12, color: '#4b5563' }}>Set up in <a href="/client-config" style={{ color: '#3b82f6' }}>Client Config â†’ Google Search Console</a></div>
              </div>
            )}

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
                {kwWithCounts.map(kw => (
                  <div key={kw.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{kw.keyword}</div>
                      {kw.target_url && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{kw.target_url}</div>}
                      <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>Added {timeAgo(kw.created_at)}</div>
                    </div>
                    <button onClick={() => openKeywordModal(kw)}
                      style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, padding: '8px 14px', color: '#f43f5e', cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                      View Details â†’
                    </button>
                    <button onClick={() => deleteKeyword(kw.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mainTab === 'competitors' && (
          <div>
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
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{c.name[0].toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{c.name}</div>
                        {c.domain && <div style={{ fontSize: 12, color: '#6b7280' }}>{c.domain}</div>}
                        {Object.keys(c.social_handles || {}).length > 0 && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            {Object.entries(c.social_handles || {}).map(([platform, handle]) => (
                              <span key={platform} style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>{platform}: {handle as string}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => scrapeCompetitor(c)} disabled={scrapeCompLoading === c.id}
                        style={{ background: scrapeCompLoading === c.id ? 'rgba(255,255,255,0.03)' : 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 6, padding: '6px 10px', color: scrapeCompLoading === c.id ? '#6b7280' : '#c084fc', cursor: scrapeCompLoading === c.id ? 'not-allowed' : 'pointer', fontSize: 11 }}>
                        {scrapeCompLoading === c.id ? '...' : 'ðŸ‘€ Check'}
                      </button>
                      <span style={{ color: '#4b5563', fontSize: 11 }}>{timeAgo(c.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedKw && (
          <KeywordDetailsModal
            keyword={selectedKw}
            rankings={kwRankings}
            mentions={kwMentions}
            reviews={kwReviews}
            loading={modalLoading}
            onClose={closeKeywordModal}
            onCheckRankings={handleCheckRankings}
            onScrapeMentions={handleScrapeMentions}
            onScrapeReviews={handleScrapeReviews}
            scrapeRankingsLoading={scrapeRankingsLoading}
            scrapeMentionsLoading={scrapeMentionsModalLoading}
            scrapeReviewsLoading={scrapeReviewsModalLoading}
            businessName={businessName}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #4b5563; }
        select option { background: #1a1a2e; }
      `}</style>
    </div>
  );
}
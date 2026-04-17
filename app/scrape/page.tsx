'use client';
import { useEffect, useState } from 'react';
import { getMcUrl } from '@/lib/mc-url';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Globe, Mail, Search, Trash2, Loader2, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, ExternalLink, AlertCircle, X, Copy, CheckCheck } from 'lucide-react';

type ScrapeMode = 'single' | 'crawl' | 'email';
type ScrapeStatus = 'pending' | 'running' | 'done' | 'error' | 'cancelled';

interface ScrapeJob {
  id: string;
  user_id: string;
  mode: ScrapeMode;
  status: ScrapeStatus;
  input_url: string;
  crawl_depth?: number;
  progress: number;
  pages_total: number;
  results: any[];
  error?: string;
  created_at: string;
  completed_at?: string;
}

const STATUS_CONFIG: Record<ScrapeStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending:   { label: 'Pending',   color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  icon: Clock },
  running:   { label: 'Running',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   icon: Loader2 },
  done:      { label: 'Done',       color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    icon: CheckCircle },
  error:     { label: 'Error',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    icon: XCircle },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: 'rgba(107,114,128,0.1)',  icon: X },
};

const MODE_TABS: { id: ScrapeMode; label: string; icon: any; placeholder: string; hint: string; depth?: boolean }[] = [
  { id: 'single', label: 'Single URL',   icon: Globe,  placeholder: 'https://example.com', hint: 'Extracts title, meta, emails, phones, and social links from one page.' },
  { id: 'crawl',  label: 'Crawl Site',   icon: Search, placeholder: 'https://example.com', hint: 'Crawls a site to a set depth and extracts data from each page.', depth: true },
  { id: 'email',  label: 'Email Finder', icon: Mail,   placeholder: 'example.com',        hint: 'Finds all email addresses and social links across a domain.' },
];

export default function ScrapePage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [activeTab, setActiveTab] = useState<ScrapeMode>('single');
  const [inputUrl, setInputUrl] = useState('');
  const [crawlDepth, setCrawlDepth] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ScrapeJob | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  async function loadJobs() {
    try {
      const url = await getMcUrl();
      const res = await fetch(`${url}/api/scrape/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch {}
    setLoadingJobs(false);
  }

  useEffect(() => { loadJobs(); }, []);

  // Poll running jobs
  useEffect(() => {
    const running = jobs.find(j => j.status === 'running');
    if (!running) return;
    const timer = setTimeout(loadJobs, 3000);
    return () => clearTimeout(timer);
  }, [jobs]);

  async function startScrape() {
    if (!inputUrl.trim()) return;
    setLoading(true);
    try {
      const url = await getMcUrl();
      const body: any = { mode: activeTab, input_url: inputUrl.trim() };
      if (activeTab === 'crawl') body.crawl_depth = crawlDepth;
      const res = await fetch(`${url}/api/scrape/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setInputUrl('');
        await loadJobs();
      }
    } catch {}
    setLoading(false);
  }

  async function openJobDetail(job: ScrapeJob) {
    if (expandedJob === job.id) { setExpandedJob(null); setSelectedJob(null); return; }
    setExpandedJob(job.id);
    if (job.status === 'done' && !job.results?.length === false) {
      try {
        const url = await getMcUrl();
        const res = await fetch(`${url}/api/scrape/jobs/${job.id}`);
        if (res.ok) setSelectedJob(await res.json());
      } catch {}
    } else {
      setSelectedJob(job);
    }
  }

  async function deleteJob(id: string) {
    try {
      const url = await getMcUrl();
      await fetch(`${url}/api/scrape/jobs/${id}`, { method: 'DELETE' });
      setJobs(jobs => jobs.filter(j => j.id !== id));
      if (expandedJob === id) { setExpandedJob(null); setSelectedJob(null); }
    } catch {}
  }

  function copyField(value: string, key: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1500);
    });
  }

  function StatusBadge({ status }: { status: ScrapeStatus }) {
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
        <Icon size={11} style={status === 'running' ? { animation: 'spin 1s linear infinite' } : {}} />
        {cfg.label}
      </span>
    );
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  function renderSingleResult(r: any) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        {r.url && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, wordBreak: 'break-all' }}>{r.url}</div>}
        <GridField label="Title" value={r.title} />
        <GridField label="Description" value={r.description} />
        {r.h1?.length > 0 && <GridField label="H1" value={r.h1.join(', ')} />}
        <GridField label="Emails" value={r.emails?.join(', ')} copyable />
        <GridField label="Phones" value={r.phones?.join(', ')} copyable />
        {r.socials && Object.entries(r.socials).filter(([,v]) => v).map(([k,v]) => (
          <GridField key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v as string} copyable />
        ))}
      </div>
    );
  }

  function renderEmailResult(r: any) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        {r.domain && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>{r.domain}</div>}
        <GridField label="Title" value={r.page_title} />
        <GridField label="Emails Found" value={r.emails?.join(', ')} copyable highlight={r.emails?.length > 0} />
        {r.socials && Object.entries(r.socials).filter(([,v]) => v).map(([k,v]) => (
          <GridField key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v as string} copyable />
        ))}
      </div>
    );
  }

  function renderCrawlResult(r: any) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#3b82f6', textDecoration: 'none', wordBreak: 'break-all', flex: 1 }}>
            {r.url} <ExternalLink size={10} style={{ display: 'inline' }} />
          </a>
        </div>
        {r.title && <div style={{ fontSize: 12, color: '#e5e7eb', marginBottom: 4 }}>{r.title}</div>}
        {r.description && <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>{r.description.substring(0, 120)}{r.description.length > 120 ? '...' : ''}</div>}
        {r.emails?.length > 0 && <div style={{ fontSize: 11, color: '#22c55e' }}>Emails: {r.emails.join(', ')}</div>}
        {r.error && <div style={{ fontSize: 11, color: '#ef4444' }}>Error: {r.error}</div>}
        {r.socials && Object.values(r.socials).some(v => v) && (
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            {Object.entries(r.socials).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join(' | ')}
          </div>
        )}
      </div>
    );
  }

  function GridField({ label, value, copyable, highlight }: { label: string; value?: string; copyable?: boolean; highlight?: boolean }) {
    if (!value) return null;
    const key = label + value;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6, marginBottom: 6, alignItems: 'start' }}>
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, paddingTop: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: highlight ? '#22c55e' : '#e5e7eb', wordBreak: 'break-all' }}>
          {value}
          {copyable && (
            <button onClick={() => copyField(value, key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#6b7280', display: 'inline-flex', verticalAlign: 'middle', marginLeft: 4 }}>
              {copiedField === key ? <CheckCheck size={11} /> : <Copy size={11} />}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          <div style={{ background: 'rgba(139,92,246,0.15)', borderRadius: 10, padding: 8 }}>
            <Download size={20} style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f9fafb' }}>Web Scraper</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Extract data from any website</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px' }}>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {MODE_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, background: activeTab === tab.id ? 'rgba(139,92,246,0.2)' : 'transparent',
                  border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                  color: activeTab === tab.id ? '#a78bfa' : '#6b7280', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s',
                }}>
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Input Form */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 22, marginBottom: 28 }}>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 14px' }}>{MODE_TABS.find(t => t.id === activeTab)?.hint}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && startScrape()}
              placeholder={MODE_TABS.find(t => t.id === activeTab)?.placeholder}
              style={{ flex: 1, minWidth: 220, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '11px 14px', color: '#f3f4f6', fontSize: 14, outline: 'none' }}
            />
            {activeTab === 'crawl' && (
              <select value={crawlDepth} onChange={e => setCrawlDepth(Number(e.target.value))}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '11px 14px', color: '#f3f4f6', fontSize: 14, cursor: 'pointer' }}>
                <option value={1}>1 page</option>
                <option value={5}>5 pages</option>
                <option value={10}>10 pages</option>
                <option value={25}>25 pages</option>
              </select>
            )}
            <button onClick={startScrape} disabled={loading || !inputUrl.trim()}
              style={{
                background: loading || !inputUrl.trim() ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.9)',
                border: 'none', borderRadius: 9, padding: '11px 20px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
              }}>
              {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
              {loading ? 'Starting...' : 'Scrape'}
            </button>
          </div>
        </motion.div>

        {/* Job History */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>Recent Jobs</h2>
          <button onClick={loadJobs} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Loader2 size={12} style={loadingJobs ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
        </div>

        {loadingJobs && jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: 13 }}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#4b5563', fontSize: 13 }}>
            No scrapes yet. Enter a URL above to get started.
          </div>
        ) : (
          <div>
            {jobs.map(job => (
              <div key={job.id} style={{ marginBottom: 8 }}>
                <div onClick={() => openJobDetail(job)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${expandedJob === job.id ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '13px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>
                        {MODE_TABS.find(t => t.id === job.mode)?.label}
                      </span>
                      <StatusBadge status={job.status} />
                      {job.status === 'running' && job.progress > 0 && (
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{job.progress}{job.pages_total > 0 ? `/${job.pages_total}` : ''} pages</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.input_url}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#4b5563' }}>{timeAgo(job.created_at)}</span>
                    {expandedJob === job.id ? <ChevronUp size={14} style={{ color: '#6b7280' }} /> : <ChevronDown size={14} style={{ color: '#6b7280' }} />}
                    <button onClick={e => { e.stopPropagation(); deleteJob(job.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 4 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Expanded Results */}
                <AnimatePresence>
                  {expandedJob === job.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}>
                        {job.status === 'running' && (
                          <div style={{ padding: '14px 16px', textAlign: 'center', color: '#6b7280', fontSize: 12 }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: 6 }} />
                            Scraping in progress...
                          </div>
                        )}
                        {job.status === 'error' && (
                          <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderTop: 'none', borderRadius: '0 0 12px 12px' }}>
                            <div style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <AlertCircle size={12} /> {job.error || 'Unknown error'}
                            </div>
                          </div>
                        )}
                        {(job.status === 'done' || selectedJob) && (
                          <div style={{ padding: '14px 16px', borderTop: 'none' }}>
                            {selectedJob?.results && selectedJob.results.length > 0 ? (
                              selectedJob.mode === 'single' && selectedJob.results.length === 1 ? (
                                renderSingleResult(selectedJob.results[0])
                              ) : selectedJob.mode === 'email' ? (
                                renderEmailResult(selectedJob.results)
                              ) : (
                                selectedJob.results.map((r: any, i: number) => renderCrawlResult(r))
                              )
                            ) : (
                              <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>No results yet</div>
                            )}
                          </div>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

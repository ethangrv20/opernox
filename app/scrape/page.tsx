'use client';
import { useEffect, useState } from 'react';
import { getMcUrl } from '@/lib/mc-url';
import {
  MapPin, Search, Globe, Download, Trash2, Loader2, CheckCircle, XCircle,
  Clock, ChevronDown, Copy, Check, X, FileSpreadsheet, Zap
} from 'lucide-react';
import { saveAs } from 'file-saver';

type ScrapeType = 'maps' | 'keywords' | 'domain';
type ScrapeStatus = 'pending' | 'running' | 'done' | 'error';

const SCRAPE_TYPES = [
  { id: 'maps' as ScrapeType, label: 'Maps', icon: MapPin, color: '#ef4444', placeholder: 'roofing companies new york, dentists in chicago...', hint: 'Takes 30-60s — real Google Maps data' },
  { id: 'keywords' as ScrapeType, label: 'Keywords', icon: Search, color: '#3b82f6', placeholder: 'marketing software, CRM tools...', hint: 'Get keyword ideas from Google' },
  { id: 'domain' as ScrapeType, label: 'Domain', icon: Globe, color: '#22c55e', placeholder: 'https://example.com', hint: 'Scrape a URL for contact info & meta' },
];

function DownloadBtn({ job }: { job: any }) {
  if (job.status !== 'done' || !job.results?.length) return null;
  function download() {
    const headers = Object.keys(job.results[0]);
    const csv = [headers.join(','), ...job.results.map((row: any) =>
      headers.map(h => { const v = String(row[h] ?? ''); return v.includes(',') ? `"${v}"` : v; }).join(',')
    )].join('\n');
    saveAs(new Blob([csv], { type: 'text/csv' }), `${job.type}_${job.id.slice(0, 8)}.csv`);
  }
  return (
    <button onClick={download} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#4ade80', background: 'none', border: '1px solid #166534', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' }}>
      <Download size={10} /> CSV
    </button>
  );
}

function JobCard({ job, onDelete }: { job: any; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const statusConfig: Record<string, { color: string; bg: string }> = {
    pending: { color: '#9ca3af', bg: '#27272a' },
    running: { color: '#60a5fa', bg: '#1e3a5f' },
    done: { color: '#4ade80', bg: '#14532d' },
    error: { color: '#f87171', bg: '#7f1d1d' },
  };
  const cfg = statusConfig[job.status] || statusConfig.pending;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div style={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', overflow: 'hidden' }}>
      {/* Card Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', backgroundColor: 'transparent', borderBottom: expanded ? '1px solid #27272a' : 'none' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          {/* Status dot */}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0, opacity: job.status === 'running' ? 0.6 : 1 }} />
          {/* Spinner for running */}
          {job.status === 'running' && <Loader2 size={13} style={{ color: '#60a5fa', animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
          {job.status === 'done' && <CheckCircle size={13} style={{ color: '#4ade80', flexShrink: 0 }} />}
          {job.status === 'error' && <XCircle size={13} style={{ color: '#f87171', flexShrink: 0 }} />}
          {job.status === 'pending' && <Clock size={13} style={{ color: '#9ca3af', flexShrink: 0 }} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.query || job.input_url}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 600 }}>{job.type}</span>
              <span style={{ fontSize: '0.7rem', color: '#52525b' }}>·</span>
              <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{job.result_count || 0} results</span>
              <span style={{ fontSize: '0.7rem', color: '#52525b' }}>·</span>
              <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{job.status}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <DownloadBtn job={job} />
          <button onClick={(e) => { e.stopPropagation(); onDelete(job.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#52525b' }}>
            <Trash2 size={13} />
          </button>
          <ChevronDown size={13} style={{ color: '#52525b', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {/* Expanded Results */}
      {expanded && (
        <div style={{ borderTop: '1px solid #27272a', maxHeight: '400px', overflowY: 'auto' }}>
          {job.status === 'error' && (
            <div style={{ padding: '12px 16px' }}><p style={{ color: '#f87171', fontSize: '0.75rem' }}>{job.error}</p></div>
          )}
          {job.status === 'done' && !job.results?.length && (
            <div style={{ padding: '16px', textAlign: 'center' }}><p style={{ color: '#52525b', fontSize: '0.8rem' }}>No results returned</p></div>
          )}
          {job.status === 'done' && job.results?.map((r: any, i: number) => (
            <ResultRow key={i} data={r} type={job.type} onCopy={copy} copied={copied} />
          ))}
          {job.status === 'running' && (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <Loader2 size={16} style={{ color: '#60a5fa', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <p style={{ color: '#71717a', fontSize: '0.75rem', marginTop: '8px' }}>Scraping in progress...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({ data, type, onCopy, copied }: { data: any; type: string; onCopy: (v: string, k: string) => void; copied: string | null }) {
  if (type === 'maps') {
    return (
      <div style={{ margin: '8px 12px', backgroundColor: '#09090b', borderRadius: '8px', padding: '10px 12px', border: '1px solid #27272a' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'white', lineHeight: 1.3 }}>{data.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {data.rating && <span style={{ color: '#eab308', fontSize: '0.7rem' }}>★ {data.rating}</span>}
            {data.reviews && <span style={{ color: '#71717a', fontSize: '0.7rem' }}>({data.reviews})</span>}
          </div>
        </div>
        {data.address && <p style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '3px' }}>{data.address}</p>}
        {data.phone && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: '#d4d4d8' }}>{data.phone}</span>
            <button onClick={() => onCopy(data.phone, `p${data.name}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#71717a' }}>
              {copied === `p${data.name}` ? <Check size={10} style={{ color: '#4ade80' }} /> : <Copy size={10} />}
            </button>
          </div>
        )}
      </div>
    );
  }
  if (type === 'keywords') {
    return (
      <div style={{ margin: '4px 12px', backgroundColor: '#09090b', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #27272a' }}>
        <span style={{ fontSize: '0.8rem', color: '#e4e4e7' }}>{data.keyword}</span>
        <button onClick={() => onCopy(data.keyword, `k${data.keyword}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#71717a' }}>
          {copied === `k${data.keyword}` ? <Check size={10} style={{ color: '#4ade80' }} /> : <Copy size={10} />}
        </button>
      </div>
    );
  }
  // Domain
  return (
    <div style={{ margin: '8px 12px', backgroundColor: '#09090b', borderRadius: '8px', padding: '10px 12px', border: '1px solid #27272a' }}>
      {data.title && <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'white' }}>{data.title}</p>}
      {data.url && <a href={data.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}><Download size={9} />{data.url}</a>}
      {data.description && <p style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '4px' }}>{data.description?.slice(0, 120)}</p>}
      {data.emails?.length > 0 && <p style={{ fontSize: '0.72rem', color: '#d4d4d8', marginTop: '4px' }}>✉ {data.emails.slice(0, 3).join(', ')}</p>}
    </div>
  );
}

export default function ScrapePage() {
  const [tab, setTab] = useState<ScrapeType>('maps');
  const [input, setInput] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const active = SCRAPE_TYPES.find(t => t.id === tab)!;
  const running = jobs.filter(j => j.status === 'running').length;

  async function loadJobs() {
    try {
      const baseUrl = await getMcUrl();
      const res = await fetch(`${baseUrl}/api/scrape/jobs`);
      if (!res.ok) return;
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { return; }
      setJobs(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch { /* silent */ }
  }

  useEffect(() => {
    loadJobs();
    const iv = setInterval(loadJobs, 5000);
    return () => clearInterval(iv);
  }, []);

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const body: any = { type: tab };
      if (tab === 'domain') body.input_url = input;
      else body.query = input;
      body.max_results = maxResults;
      const baseUrl = await getMcUrl();
      const res = await fetch(`${baseUrl}/api/scrape/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Server returned an error. Try again.'); }
      if (!res.ok) throw new Error(data.error || 'Failed to start scrape');
      setInput('');
      await loadJobs();
    } catch (err: any) {
      setError(err.message || err.toString());
    } finally {
      setLoading(false);
    }
  }

  async function deleteJob(id: string) {
    const baseUrl = await getMcUrl();
    await fetch(`${baseUrl}/api/scrape/jobs/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: 'white' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: '672px', margin: '0 auto', padding: '40px 16px 64px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>Scraping Suite</h1>
            <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '2px' }}>Google Maps, Keywords &amp; Domain data</p>
          </div>
          {running > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 500, backgroundColor: '#1e3a5f', padding: '6px 12px', borderRadius: '20px' }}>
              <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> {running} running
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', padding: '4px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a' }}>
          {SCRAPE_TYPES.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'white' : 'transparent',
                  color: isActive ? 'black' : '#a1a1aa',
                }}>
                <Icon size={15} style={{ color: isActive ? t.color : '#71717a' }} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleScrape} style={{ marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '20px' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={active.placeholder}
              style={{
                width: '100%',
                backgroundColor: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#3f3f46'}
              onBlur={e => e.target.style.borderColor = '#27272a'}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', color: '#71717a' }}>{active.hint}</p>
              </div>
              <select value={maxResults} onChange={e => setMaxResults(Number(e.target.value))}
                style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}>
                {[10, 25, 50, 100, 250, 500].map(n => <option key={n} value={n}>{n} results</option>)}
              </select>
              <button type="submit" disabled={loading || !input.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading || !input.trim() ? 0.4 : 1,
                  backgroundColor: active.color,
                  color: 'white',
                }}>
                {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={15} />}
                {loading ? 'Scraping...' : 'Scrape'}
              </button>
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.75rem', marginTop: '12px', backgroundColor: '#7f1d1d', padding: '8px 12px', borderRadius: '8px' }}>
                <X size={11} /> {error}
              </div>
            )}
          </div>
        </form>

        {/* Jobs */}
        <div>
          <h2 style={{ fontSize: '0.7rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Recent Jobs</h2>
          {jobs.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: '56px', paddingBottom: '56px', color: '#52525b' }}>
              <Zap size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>No scrapes yet — pick a tab and try it</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {jobs.map(job => (
              <JobCard key={job.id} job={job} onDelete={deleteJob} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

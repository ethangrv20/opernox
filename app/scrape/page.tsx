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

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  pending: { color: '#9ca3af', icon: Clock },
  running: { color: '#3b82f6', icon: Loader2 },
  done: { color: '#22c55e', icon: CheckCircle },
  error: { color: '#ef4444', icon: XCircle },
};

function DownloadBtn({ job }: { job: any }) {
  if (job.status !== 'done' || !job.result_count) return null;
  function download() {
    if (!job.results?.length) return;
    const headers = Object.keys(job.results[0]);
    const csv = [headers.join(','), ...job.results.map((row: any) =>
      headers.map(h => { const v = String(row[h] ?? ''); return v.includes(',') ? `"${v}"` : v; }).join(',')
    )].join('\n');
    saveAs(new Blob([csv], { type: 'text/csv' }), `${job.type}_${job.id.slice(0, 8)}.csv`);
  }
  return (
    <button onClick={download} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 px-2 py-0.5 rounded transition">
      <Download size={11} /> CSV
    </button>
  );
}

function JobCard({ job, onDelete }: { job: any; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="bg-[#18181b] rounded-xl border border-[#27272a] overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#1f1f23] transition"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon size={14} style={{ color: cfg.color }} className={job.status === 'running' ? 'animate-spin' : ''} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{job.query || job.input_url}</p>
            <p className="text-xs text-[#71717a]">
              {job.type} &middot; {job.result_count || 0} results &middot; {new Date(job.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DownloadBtn job={job} />
          <button onClick={(e) => { e.stopPropagation(); onDelete(job.id); }} className="text-[#52525b] hover:text-red-400 transition p-1">
            <Trash2 size={13} />
          </button>
          <ChevronDown size={14} style={{ color: '#52525b' }} className={`transition ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#27272a]">
          {job.status === 'error' && (
            <div className="px-4 pt-3"><p className="text-red-400 text-xs">{job.error}</p></div>
          )}
          {job.status === 'done' && job.results?.map((r: any, i: number) => (
            <ResultRow key={i} data={r} type={job.type} onCopy={copy} copied={copied} />
          ))}
          {job.status === 'done' && !job.results?.length && (
            <div className="px-4 py-3"><p className="text-[#52525b] text-xs">No results</p></div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({ data, type, onCopy, copied }: { data: any; type: string; onCopy: (v: string, k: string) => void; copied: string | null }) {
  if (type === 'maps') {
    return (
      <div className="mx-3 my-2 bg-[#09090b] rounded-lg p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm text-white leading-tight">{data.name}</p>
          <div className="flex items-center gap-1 shrink-0">
            {data.rating && <span style={{ color: '#eab308' }} className="text-xs">★ {data.rating}</span>}
            {data.reviews && <span className="text-[#52525b] text-xs">({data.reviews})</span>}
          </div>
        </div>
        {data.address && <p className="text-xs text-[#a1a1aa] mt-1">{data.address}</p>}
        {data.phone && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-[#d4d4d8]">{data.phone}</span>
            <button onClick={() => onCopy(data.phone, `p${data.name}`)} className="text-[#52525b] hover:text-white transition">
              {copied === `p${data.name}` ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            </button>
          </div>
        )}
      </div>
    );
  }
  if (type === 'keywords') {
    return (
      <div className="mx-3 my-1 bg-[#09090b] rounded-md px-3 py-2 flex items-center justify-between">
        <span className="text-sm text-[#e4e4e7]">{data.keyword}</span>
        <button onClick={() => onCopy(data.keyword, `k${data.keyword}`)} className="text-[#52525b] hover:text-white transition">
          {copied === `k${data.keyword}` ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
        </button>
      </div>
    );
  }
  return (
    <div className="mx-3 my-2 bg-[#09090b] rounded-lg p-3 space-y-1">
      {data.title && <p className="text-sm font-medium text-white">{data.title}</p>}
      {data.url && <a href={data.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1"><Download size={10} /> {data.url}</a>}
      {data.description && <p className="text-xs text-[#a1a1aa]">{data.description.slice(0, 100)}</p>}
      {data.emails?.length > 0 && <p className="text-xs text-[#d4d4d8]">✉ {data.emails.slice(0, 3).join(', ')}</p>}
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

  useEffect(() => {
    loadJobs();
    const iv = setInterval(loadJobs, 5000);
    return () => clearInterval(iv);
  }, []);

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
      try { data = JSON.parse(text); } catch { throw new Error('Server returned an error. Try again in a moment.'); }
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>Scraping Suite</h1>
            <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '2px' }}>Google Maps, Keywords &amp; Domain data</p>
          </div>
          {running > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 500 }}>
              <Loader2 size={12} className="animate-spin" /> {running} running
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
                  transition: 'all 0.15s',
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
        <form onSubmit={handleScrape} style={{ marginBottom: '24px' }}>
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
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {loading ? 'Scraping...' : 'Scrape'}
              </button>
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.75rem', marginTop: '12px' }}>
                <X size={11} /> {error}
              </div>
            )}
          </div>
        </form>

        {/* Jobs */}
        <div>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Recent Jobs</h2>
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

'use client';
import { useEffect, useState } from 'react';
import { getMcUrl } from '@/lib/mc-url';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MapPin, Search, Globe, Download, Trash2, Loader2, CheckCircle, XCircle,
  Clock, ChevronDown, Copy, Check, X, FileSpreadsheet, Zap
} from 'lucide-react';
import { saveAs } from 'file-saver';

type ScrapeType = 'maps' | 'keywords' | 'domain';
type ScrapeStatus = 'pending' | 'running' | 'done' | 'error';

const SCRAPE_TYPES = [
  { id: 'maps' as ScrapeType, label: 'Maps', icon: MapPin, color: '#ef4444', placeholder: 'restaurants in chicago, lawyers near me...', hint: 'Find businesses on Google Maps' },
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
    <button onClick={download} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition px-2 py-1 rounded-md hover:bg-green-500/10">
      <Download size={12} /> CSV
    </button>
  );
}

function JobCard({ job }: { job: any }) {
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
    <div className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon size={15} style={{ color: cfg.color }} className={job.status === 'running' ? 'animate-spin' : ''} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{job.query || job.input_url}</p>
            <p className="text-xs text-gray-500">{job.type} &middot; {job.result_count || 0} results &middot; {new Date(job.created_at).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DownloadBtn job={job} />
          <ChevronDown size={14} className={`text-gray-500 transition ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-white/5">
              {job.status === 'error' && <p className="text-red-400 text-xs mt-3">{job.error}</p>}
              {job.status === 'done' && job.results?.map((r: any, i: number) => (
                <ResultRow key={i} data={r} type={job.type} onCopy={copy} copied={copied} />
              ))}
              {job.status === 'done' && !job.results?.length && <p className="text-gray-500 text-xs mt-3">No results</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultRow({ data, type, onCopy, copied }: { data: any; type: string; onCopy: (v: string, k: string) => void; copied: string | null }) {
  if (type === 'maps') {
    return (
      <div className="mt-2 bg-[#0f0f12] rounded-lg p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-white text-sm leading-tight">{data.name}</p>
          <div className="flex items-center gap-1 shrink-0">
            {data.rating && <span className="text-yellow-400 text-xs">★ {data.rating}</span>}
            {data.reviews && <span className="text-gray-500 text-xs">({data.reviews})</span>}
          </div>
        </div>
        {data.address && <p className="text-xs text-gray-400 mt-1">{data.address}</p>}
        {data.phone && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-300">{data.phone}</span>
            <button onClick={() => onCopy(data.phone, `p${data.name}`)} className="text-gray-600 hover:text-white">
              {copied === `p${data.name}` ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            </button>
          </div>
        )}
      </div>
    );
  }
  if (type === 'keywords') {
    return (
      <div className="mt-1 bg-[#0f0f12] rounded-md px-3 py-2 flex items-center justify-between">
        <span className="text-sm text-gray-200">{data.keyword}</span>
        <button onClick={() => onCopy(data.keyword, `k${data.keyword}`)} className="text-gray-600 hover:text-white">
          {copied === `k${data.keyword}` ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
        </button>
      </div>
    );
  }
  return (
    <div className="mt-2 bg-[#0f0f12] rounded-lg p-3 space-y-1">
      {data.title && <p className="text-sm font-medium text-white">{data.title}</p>}
      {data.url && <a href={data.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1"><Download size={10} /> {data.url}</a>}
      {data.description && <p className="text-xs text-gray-400">{data.description.slice(0, 100)}</p>}
      {data.emails?.length > 0 && <p className="text-xs text-gray-300">✉ {data.emails.slice(0, 3).join(', ')}</p>}
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
      const res = await fetch(`${getMcUrl()}/api/scrape/jobs`);
      if (!res.ok) return;
      const data = await res.json();
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
      const res = await fetch(`${getMcUrl()}/api/scrape/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setInput('');
      await loadJobs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteJob(id: string) {
    await fetch(`${getMcUrl()}/api/scrape/jobs/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Scraping Suite</h1>
            <p className="text-gray-500 text-sm mt-0.5">Google Maps, Keywords & Domain data</p>
          </div>
          {running > 0 && (
            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium">
              <Loader2 size={12} className="animate-spin" /> {running} running
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 p-1 bg-[#18181b] rounded-xl border border-white/5">
          {SCRAPE_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                  tab === t.id ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                <Icon size={15} style={{ color: tab === t.id ? t.color : undefined }} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleScrape} className="mb-6">
          <div className="bg-[#18181b] rounded-2xl border border-white/10 p-5">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={active.placeholder}
              className="w-full bg-[#0f0f12] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/20 text-sm mb-4"
            />
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500">{active.hint}</p>
              </div>
              <select value={maxResults} onChange={e => setMaxResults(Number(e.target.value))}
                className="bg-[#0f0f12] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none cursor-pointer">
                {[10,25,50,100,250,500].map(n => <option key={n} value={n}>{n} results</option>)}
              </select>
              <button type="submit" disabled={loading || !input.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white transition disabled:opacity-40"
                style={{ backgroundColor: active.color }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {loading ? 'Scraping...' : 'Scrape'}
              </button>
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-1.5 text-red-400 text-xs">
                <X size={11} /> {error}
              </div>
            )}
          </div>
        </form>

        {/* Jobs */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Jobs</h2>
          {jobs.length === 0 && (
            <div className="text-center py-14 text-gray-600">
              <Zap size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No scrapes yet — pick a tab and try it</p>
            </div>
          )}
          <div className="space-y-2">
            {jobs.map(job => (
              <div key={job.id} className="relative group">
                <JobCard job={job} />
                <button onClick={() => deleteJob(job.id)}
                  className="absolute top-3 right-10 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

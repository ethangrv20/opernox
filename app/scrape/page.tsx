'use client';
import { useEffect, useState } from 'react';
import { getMcUrl } from '@/lib/mc-url';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Search, Globe, Download, Trash2, Loader2, CheckCircle, XCircle,
  Clock, ChevronDown, ChevronUp, ExternalLink, Copy, Check, X, FileSpreadsheet
} from 'lucide-react';
import { saveAs } from 'file-saver';

type ScrapeType = 'maps' | 'keywords' | 'domain';
type ScrapeStatus = 'pending' | 'running' | 'done' | 'error';

const SCRAPE_TYPES = [
  {
    id: 'maps' as ScrapeType,
    label: 'Google Maps',
    icon: Map,
    placeholder: 'restaurants in chicago, lawyers near me, plumbers NYC',
    hint: 'Enter a search query to find businesses on Google Maps',
    color: '#ef4444',
  },
  {
    id: 'keywords' as ScrapeType,
    label: 'Keywords',
    icon: Search,
    placeholder: 'marketing software, CRM tools, sales automation',
    hint: 'Enter a seed keyword to get related keyword ideas from Google',
    color: '#3b82f6',
  },
  {
    id: 'domain' as ScrapeType,
    label: 'Domain',
    icon: Globe,
    placeholder: 'https://example.com',
    hint: 'Enter a URL to scrape title, meta, headings, emails, and social links',
    color: '#22c55e',
  },
];

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#9ca3af', icon: Clock },
  running:   { label: 'Running',    color: '#3b82f6', icon: Loader2 },
  done:      { label: 'Done',      color: '#22c55e', icon: CheckCircle },
  error:     { label: 'Error',     color: '#ef4444', icon: XCircle },
};

function JobCard({ job, onExpand }: { job: any; onExpand: () => void }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }

  function downloadCSV() {
    if (!job.results || job.results.length === 0) return;
    const headers = Object.keys(job.results[0]);
    const csv = [
      headers.join(','),
      ...job.results.map((row: any) =>
        headers.map(h => {
          const val = String(row[h] ?? '');
          return val.includes(',') ? `"${val}"` : val;
        }).join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${job.type || 'scrape'}_${job.id.substring(0, 8)}.csv`);
  }

  const StatusIcon = STATUS_CONFIG[job.status as ScrapeStatus]?.icon || Clock;

  return (
    <div className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition"
        onClick={onExpand}
      >
        <div className="flex items-center gap-3">
          <StatusIcon size={18} style={{ color: STATUS_CONFIG[job.status as ScrapeStatus]?.color }} className={job.status === 'running' ? 'animate-spin' : ''} />
          <div>
            <p className="font-medium text-white text-sm">{job.query || job.input_url}</p>
            <p className="text-xs text-gray-400">
              {job.type || job.mode} &middot; {job.result_count || 0} results &middot; {new Date(job.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {job.status === 'done' && job.result_count > 0 && (
            <button onClick={(e) => { e.stopPropagation(); downloadCSV(); }} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition" title="Download CSV">
              <FileSpreadsheet size={14} />
            </button>
          )}
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

      <AnimatePresence>
        {job._expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 border-t border-white/5">
              {job.status === 'error' && (
                <div className="text-red-400 text-sm mb-3">Error: {job.error}</div>
              )}
              {job.status === 'done' && job.results && job.results.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{job.results.length} results</span>
                    <button onClick={() => downloadCSV()} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <Download size={12} /> Download CSV
                    </button>
                  </div>
                  {job.results.slice(0, 10).map((r: any, i: number) => (
                    <ResultRow key={i} data={r} type={job.type || job.mode} onCopy={copy} copiedField={copiedField} />
                  ))}
                  {job.results.length > 10 && (
                    <p className="text-xs text-gray-500 text-center">+ {job.results.length - 10} more results</p>
                  )}
                </div>
              )}
              {job.status === 'done' && (!job.results || job.results.length === 0) && (
                <p className="text-gray-400 text-sm">No results found.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultRow({ data, type, onCopy, copiedField }: { data: any; type: string; onCopy: (v: string, f: string) => void; copiedField: string | null }) {
  if (type === 'maps') {
    return (
      <div className="bg-[#0f0f12] rounded-lg p-3 space-y-1">
        <div className="flex items-start justify-between">
          <p className="font-medium text-white text-sm">{data.name}</p>
          <div className="flex items-center gap-1">
            {data.rating && <span className="text-yellow-400 text-xs">&#9733; {data.rating}</span>}
            {data.reviews && <span className="text-gray-500 text-xs">({data.reviews})</span>}
          </div>
        </div>
        {data.address && <p className="text-xs text-gray-400">&#x1F4CD; {data.address}</p>}
        {data.phone && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-300">&#x1F4DE; {data.phone}</p>
            <button onClick={() => onCopy(data.phone, `phone-${data.name}`)} className="text-gray-600 hover:text-gray-300">
              {copiedField === `phone-${data.name}` ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        )}
      </div>
    );
  }
  if (type === 'keywords') {
    return (
      <div className="bg-[#0f0f12] rounded-lg p-2 flex items-center justify-between">
        <span className="text-sm text-white">{data.keyword}</span>
        <button onClick={() => onCopy(data.keyword, `kw-${data.keyword}`)} className="text-gray-600 hover:text-gray-300">
          {copiedField === `kw-${data.keyword}` ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
    );
  }
  // domain
  return (
    <div className="bg-[#0f0f12] rounded-lg p-3 space-y-1">
      {data.title && <p className="font-medium text-white text-sm">{data.title}</p>}
      {data.url && <a href={data.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1"><ExternalLink size={10} /> {data.url}</a>}
      {data.description && <p className="text-xs text-gray-400">{data.description.substring(0, 100)}</p>}
      {data.emails && data.emails.length > 0 && <p className="text-xs text-gray-300">&#x1F4E7; {data.emails.join(', ')}</p>}
    </div>
  );
}

export default function ScrapePage() {
  const [activeTab, setActiveTab] = useState<ScrapeType>('maps');
  const [input, setInput] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState('');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  async function loadJobs() {
    try {
      const res = await fetch(`${getMcUrl()}/api/scrape/jobs`);
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.sort((a: any, b: any) => new Date(b.created_at) - new Date(a.created_at)));
    } catch {}
  }

  useEffect(() => { loadJobs(); const interval = setInterval(loadJobs, 5000); return () => clearInterval(interval); }, []);

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const body: any = { type: activeTab };
      if (activeTab === 'domain') body.input_url = input;
      else body.query = input;
      body.max_results = maxResults;

      const res = await fetch(`${getMcUrl()}/api/scrape/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start scrape');
      await loadJobs();
      setInput('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedJob(prev => prev === id ? null : id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, _expanded: prev !== id } : j));
  }

  async function deleteJob(id: string) {
    await fetch(`${getMcUrl()}/api/scrape/jobs/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
  }

  const activeType = SCRAPE_TYPES.find(t => t.id === activeTab)!;
  const runningCount = jobs.filter(j => j.status === 'running').length;

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Scraping Suite</h1>
            <p className="text-gray-400 text-sm mt-1">Generate leads with Google Maps, Keywords, or Domain data</p>
          </div>
          {runningCount > 0 && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Loader2 size={14} className="animate-spin" />
              {runningCount} job(s) running
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6">
          {SCRAPE_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === t.id
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Icon size={16} style={{ color: activeTab === t.id ? t.color : undefined }} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Scrape Form */}
        <form onSubmit={handleScrape} className="bg-[#18181b] rounded-2xl border border-white/10 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {activeTab === 'maps' ? 'Search Query' : activeTab === 'keywords' ? 'Seed Keyword' : 'URL to Scrape'}
          </label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={activeType.placeholder}
            className="w-full bg-[#0f0f12] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/20 text-sm mb-4"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{activeType.hint}</p>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400">Max results:</label>
              <select
                value={maxResults}
                onChange={e => setMaxResults(Number(e.target.value))}
                className="bg-[#0f0f12] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: activeType.color }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                {loading ? 'Scraping...' : 'Scrape'}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
              <X size={12} /> {error}
            </div>
          )}
        </form>

        {/* Job History */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Recent Jobs</h2>
          {jobs.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              <Map size={32} className="mx-auto mb-2 opacity-30" />
              No scrapes yet — try one above
            </div>
          )}
          <div className="space-y-2">
            {jobs.map(job => (
              <div key={job.id} className="relative">
                <JobCard job={job} onExpand={() => toggleExpand(job.id)} />
                <button
                  onClick={() => deleteJob(job.id)}
                  className="absolute top-4 right-12 text-gray-600 hover:text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
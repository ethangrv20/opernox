'use client';
import { useEffect, useState } from 'react';
import { getMcUrl } from '@/lib/mc-url';
import {
  MapPin, Search, Globe, Download, Trash2, Loader2, CheckCircle, XCircle,
  Clock, ChevronDown, Copy, Check, X, Zap, Phone as PhoneIcon, MapPinned,
  Star, Filter, Globe as GlobeIcon, Crosshair, Database, User, Building, Briefcase, DollarSign, Smartphone
} from 'lucide-react';
import { saveAs } from 'file-saver';

type ScrapeType = 'maps_pro' | 'leads_finder' | 'search_results';

const SCRAPE_TYPES = [
  { id: 'maps_pro' as ScrapeType, label: 'Maps', icon: MapPin, color: '#f97316', placeholder: 'pizza, roofing companies, dentists...', hint: '15-30s · Up to 120 results per search' },
  { id: 'leads_finder' as ScrapeType, label: 'Leads', icon: Database, color: '#a855f7', placeholder: 'marketing managers', hint: '15-30s · B2B contacts with emails & phones' },
  { id: 'search_results' as ScrapeType, label: 'Search', icon: Search, color: '#3b82f6', placeholder: 'best CRM software 2025', hint: '15-30s · Google organic search results' },
];

function downloadCSV(job: any) {
  if (!job.results?.length) return;
  const headers = Object.keys(job.results[0]);
  const csv = [
    headers.join(','),
    ...job.results.map((row: any) =>
      headers.map(h => {
        const v = row[h];
        const s = (v === null || v === undefined) ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    )
  ].join('\n');
  saveAs(new Blob([csv], { type: 'text/csv' }), `${job.type}_${job.query?.slice(0, 20) || 'scrape'}_${job.id.slice(0, 6)}.csv`);
}

function JobRow({ job, onDelete }: { job: any; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const statusMeta: Record<string, { color: string; bg: string; label: string }> = {
    running: { color: '#60a5fa', bg: '#1e3a5f', label: 'Running' },
    done:    { color: '#4ade80', bg: '#14532d', label: 'Done' },
    error:   { color: '#f87171', bg: '#7f1d1d', label: 'Error' },
    cancelled:{ color: '#9ca3af', bg: '#27272a', label: 'Cancelled' },
  };
  const sm = statusMeta[job.status] || statusMeta.cancelled;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const typeColors: Record<string, string> = { maps_pro: '#f97316', leads_finder: '#a855f7', search_results: '#3b82f6' };
  const tc = typeColors[job.type] || '#71717a';

  return (
    <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '10px', cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpen(v => !v)}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tc, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.query || job.input_url || '(unnamed)'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.65rem', color: tc, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{job.type === 'maps_pro' ? 'Maps' : job.type === 'leads_finder' ? 'Leads' : job.type === 'search_results' ? 'Search' : job.type}</span>
            <span style={{ color: '#3f3f46', fontSize: '0.65rem' }}>·</span>
            {job.status === 'done' && job.result_count > 0 && <span style={{ fontSize: '0.65rem', color: '#71717a' }}>{job.result_count} results</span>}
            {job.status === 'done' && (!job.result_count || job.result_count === 0) && <span style={{ fontSize: '0.65rem', color: '#52525b' }}>no results</span>}
            {job.status === 'running' && <span style={{ fontSize: '0.65rem', color: '#60a5fa' }}>scraping...</span>}
            {job.status === 'error' && <span style={{ fontSize: '0.65rem', color: '#f87171' }}>error</span>}
            <span style={{ color: '#3f3f46', fontSize: '0.65rem' }}>·</span>
            <span style={{ fontSize: '0.65rem', color: '#52525b' }}>{new Date(job.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: sm.bg, padding: '3px 8px', borderRadius: '20px', flexShrink: 0 }}>
          {job.status === 'running' && <Loader2 size={9} style={{ color: sm.color, animation: 'spin 1s linear infinite' }} />}
          {job.status === 'done' && <CheckCircle size={9} style={{ color: sm.color }} />}
          {job.status === 'error' && <XCircle size={9} style={{ color: sm.color }} />}
          {job.status === 'cancelled' && <Clock size={9} style={{ color: sm.color }} />}
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: sm.color }}>{sm.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {job.status === 'done' && job.results?.length > 0 && (
            <button onClick={() => downloadCSV(job)} style={{ background: 'none', border: '1px solid #27272a', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Download size={10} /><span style={{ fontSize: '0.65rem' }}>CSV</span>
            </button>
          )}
          <button onClick={() => onDelete(job.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: '#52525b' }}>
            <Trash2 size={12} />
          </button>
          <ChevronDown size={12} style={{ color: '#52525b', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid #27272a', backgroundColor: '#09090b' }}>
          {job.status === 'error' && job.error && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #27272a' }}>
              <p style={{ fontSize: '0.72rem', color: '#f87171' }}>⚠ {job.error}</p>
            </div>
          )}
          {job.status === 'done' && !job.results?.length && (
            <div style={{ padding: '20px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: '#52525b' }}>No results returned for this query.</p>
            </div>
          )}
          {job.results?.map((r: any, i: number) => <ResultCard key={i} data={r} type={job.type} onCopy={copy} copied={copied} />)}
          {job.status === 'running' && (
            <div style={{ padding: '24px 14px', textAlign: 'center' }}>
              <Loader2 size={18} style={{ color: '#60a5fa', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.75rem', color: '#71717a' }}>Scraping in progress — results appear here when done.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ data, type, onCopy, copied }: { data: any; type: string; onCopy: (v: string, k: string) => void; copied: string | null }) {
  if (type === 'maps_pro') {
    return (
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{data.name || '(no name)'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
              {data.rating && <span style={{ fontSize: '0.72rem', color: '#eab308' }}>★ {data.rating}</span>}
              {data.reviews && <span style={{ fontSize: '0.72rem', color: '#71717a' }}>({data.reviews} reviews)</span>}
              {data.category && <span style={{ fontSize: '0.65rem', color: '#71717a', backgroundColor: '#27272a', padding: '1px 6px', borderRadius: '4px' }}>{data.category}</span>}
              {data.priceLevel && <span style={{ fontSize: '0.65rem', color: '#a1a1aa' }}>{data.priceLevel}</span>}
            </div>
            {data.address && (
              <p style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '5px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <MapPinned size={10} style={{ color: '#52525b', flexShrink: 0, marginTop: '2px' }} />
                <span>{data.address}{data.city ? `, ${data.city}` : ''}{data.state ? `, ${data.state}` : ''}</span>
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
            {data.phone && (
              <button onClick={() => onCopy(data.phone, `phone-${data.name}`)} style={{ background: 'none', border: '1px solid #27272a', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {copied === `phone-${data.name}` ? <Check size={10} style={{ color: '#4ade80' }} /> : <PhoneIcon size={10} />}
                <span style={{ fontSize: '0.65rem' }}>{data.phone}</span>
              </button>
            )}
            {data.website && (
              <a href={data.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.65rem', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', border: '1px solid #27272a', borderRadius: '6px' }}>
                <GlobeIcon size={10} />
                Website
              </a>
            )}
          </div>
        </div>
        {data.hours && <p style={{ fontSize: '0.65rem', color: '#52525b', marginTop: '5px' }}>🕐 {data.hours}</p>}
        {data.latitude && data.longitude && (
          <p style={{ fontSize: '0.65rem', color: '#3f3f46', marginTop: '3px' }}>📍 {parseFloat(data.latitude).toFixed(4)}, {parseFloat(data.longitude).toFixed(4)}</p>
        )}
      </div>
    );
  }

  if (type === 'leads_finder') {
    return (
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{data.name || '(no name)'}</p>
            {data.title && <p style={{ fontSize: '0.72rem', color: '#a855f7', marginTop: '2px' }}>{data.title}</p>}
            {data.company && (
              <p style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building size={10} style={{ color: '#52525b' }} />
                {data.company}{data.company_domain ? ` · ${data.company_domain}` : ''}
              </p>
            )}
            {data.location && (
              <p style={{ fontSize: '0.65rem', color: '#71717a', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPinned size={10} style={{ color: '#52525b' }} />
                {data.location}
              </p>
            )}
            {data.industry && <span style={{ fontSize: '0.6rem', color: '#52525b', backgroundColor: '#1a1a1a', padding: '1px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>{data.industry}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
            {data.email && (
              <button onClick={() => onCopy(data.email, `email-${data.name}`)} style={{ background: 'none', border: '1px solid #27272a', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {copied === `email-${data.name}` ? <Check size={10} style={{ color: '#4ade80' }} /> : <span style={{ fontSize: '0.65rem' }}>✉</span>}
                <span style={{ fontSize: '0.65rem' }}>{data.email}</span>
              </button>
            )}
            {data.phone && (
              <button onClick={() => onCopy(data.phone, `phone-${data.name}`)} style={{ background: 'none', border: '1px solid #27272a', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {copied === `phone-${data.name}` ? <Check size={10} style={{ color: '#4ade80' }} /> : <PhoneIcon size={10} />}
                <span style={{ fontSize: '0.65rem' }}>{data.phone}</span>
              </button>
            )}
            {data.linkedin_url && (
              <a href={data.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.65rem', color: '#0077b5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', border: '1px solid #27272a', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.65rem' }}>in</span>
                LinkedIn
              </a>
            )}
          </div>
        </div>
        {(data.company_size || data.company_revenue) && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            {data.company_size && <span style={{ fontSize: '0.6rem', color: '#71717a' }}>👥 {data.company_size}</span>}
            {data.company_revenue && <span style={{ fontSize: '0.6rem', color: '#71717a' }}>💰 {data.company_revenue}</span>}
          </div>
        )}
      </div>
    );
  }

  if (type === 'search_results') {
    return (
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {data.position && <span style={{ fontSize: '0.6rem', color: '#52525b', backgroundColor: '#1a1a1a', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginTop: '2px' }}>#{data.position}</span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            {data.title && (
              <a href={data.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#60a5fa', textDecoration: 'none', fontWeight: 500, display: 'block', marginBottom: '3px' }}>
                {data.title}
              </a>
            )}
            {data.display_url && (
              <p style={{ fontSize: '0.65rem', color: '#4ade80', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.display_url}
              </p>
            )}
            {data.snippet && (
              <p style={{ fontSize: '0.72rem', color: '#a1a1aa', lineHeight: 1.4 }}>{data.snippet.length > 200 ? data.snippet.slice(0, 200) + '…' : data.snippet}</p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
            {data.url && (
              <button onClick={() => onCopy(data.url, `url-${data.position}`)} style={{ background: 'none', border: '1px solid #27272a', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', color: '#52525b' }}>
                {copied === `url-${data.position}` ? <Check size={9} style={{ color: '#4ade80' }} /> : <Copy size={9} />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function ScrapePage() {
  const [tab, setTab] = useState<ScrapeType>('maps_pro');
  const [input, setInput] = useState('');
  const [maxResults, setMaxResults] = useState(100);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credits, setCredits] = useState<{ balance: number; total_used: number } | null>(null);
  const active = SCRAPE_TYPES.find(t => t.id === tab)!;

  // Maps filters
  const [minRating, setMinRating] = useState(0);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [location, setLocation] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Leads Finder filters
  const [leadIndustry, setLeadIndustry] = useState('');
  const [leadJobTitles, setLeadJobTitles] = useState('');
  const [leadCompanySize, setLeadCompanySize] = useState('');
  const [leadRevenue, setLeadRevenue] = useState('');

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

  async function loadCredits() {
    try {
      const baseUrl = await getMcUrl();
      const res = await fetch(`${baseUrl}/api/scrape/credits`);
      if (!res.ok) return;
      const data = await res.json();
      setCredits(data);
    } catch { /* silent */ }
  }

  useEffect(() => { loadJobs(); loadCredits(); const iv = setInterval(() => { loadJobs(); loadCredits(); }, 5000); return () => clearInterval(iv); }, []);

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    if (tab === 'maps_pro' && credits !== null && credits.balance <= 0) {
      setError('No places remaining. Contact support to add more.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body: any = { type: tab };
      if (tab === 'maps_pro') {
        body.query = input;
        body.location = location;
        body.onlyWithWebsite = hasWebsite;
        body.hasPhone = hasPhone;
        body.minRating = minRating;
        body.max_results = Math.min(maxResults, 120);
      } else if (tab === 'leads_finder') {
        body.query = input;
        body.location = location;
        body.industry = leadIndustry;
        body.job_titles = leadJobTitles;
        body.company_size = leadCompanySize;
        body.revenue = leadRevenue;
        body.max_results = Math.min(maxResults, 500);
      } else if (tab === 'search_results') {
        body.query = input;
        body.max_results = Math.min(maxResults, 100);
      }

      const baseUrl = await getMcUrl();
      const res = await fetch(`${baseUrl}/api/scrape/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Server error — try again.'); }
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setInput('');
      await loadJobs();
      if (tab === 'maps_pro') await loadCredits();
    } catch (err: any) {
      setError(err.message || err.toString());
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const baseUrl = await getMcUrl();
      await fetch(`${baseUrl}/api/scrape/jobs/${id}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch { /* silent */ }
  }

  const running = jobs.filter(j => j.status === 'running').length;

  const showMapsFilters = tab === 'maps_pro' && filtersOpen;
  const showLeadsFilters = tab === 'leads_finder';
  const tabHasFilters = tab === 'maps_pro' || tab === 'leads_finder';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: 'white' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 16px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'white' }}>Scraping Suite</h1>
            <p style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '3px' }}>Maps · Leads · Search</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            {running > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#1e3a5f', padding: '5px 12px', borderRadius: '20px' }}>
                <Loader2 size={10} style={{ color: '#60a5fa', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#60a5fa' }}>{running} running</span>
              </div>
            )}
            {credits !== null && tab === 'maps_pro' && (
              <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '4px 10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Places: </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: credits.balance > 0 ? '#4ade80' : '#f87171' }}>{credits.balance.toLocaleString()}</span>
                <span style={{ fontSize: '0.65rem', color: '#3f3f46' }}> left</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '18px', padding: '4px', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a' }}>
          {SCRAPE_TYPES.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '9px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer', backgroundColor: isActive ? 'white' : 'transparent', color: isActive ? 'black' : '#a1a1aa' }}>
                <Icon size={14} style={{ color: isActive ? t.color : '#71717a' }} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleScrape} style={{ marginBottom: '28px' }}>
          <div style={{ backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '18px' }}>

            {/* Main search input — all tabs use text input */}
            <div style={{ marginBottom: tabHasFilters ? '14px' : '0' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={active.placeholder}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleScrape(e as any); } }}
                style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#3f3f46'}
                onBlur={e => e.target.style.borderColor = '#27272a'}
              />
            </div>

            {/* Maps filters */}
            {tab === 'maps_pro' && (
              <div style={{ marginBottom: '14px' }}>
                <button type="button" onClick={() => setFiltersOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: filtersOpen ? '#f97316' : '#71717a', fontSize: '0.72rem', fontWeight: 500, padding: '0' }}>
                  <Filter size={11} />
                  {filtersOpen ? 'Hide filters' : 'Show filters'}
                </button>

                {showMapsFilters && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: '#52525b', marginBottom: '4px' }}>Location</label>
                      <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Chicago, IL"
                        style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#3f3f46'}
                        onBlur={e => e.target.style.borderColor = '#27272a'} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', cursor: 'pointer', color: hasWebsite ? '#4ade80' : '#a1a1aa', backgroundColor: hasWebsite ? '#14532d' : '#09090b', border: '1px solid ' + (hasWebsite ? '#166534' : '#27272a'), padding: '5px 10px', borderRadius: '8px', transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={hasWebsite} onChange={e => setHasWebsite(e.target.checked)} style={{ display: 'none' }} />
                        <GlobeIcon size={10} />Has website
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', cursor: 'pointer', color: minRating > 0 ? '#eab308' : '#a1a1aa', backgroundColor: minRating > 0 ? '#713f12' : '#09090b', border: '1px solid ' + (minRating > 0 ? '#854d0e' : '#27272a'), padding: '5px 10px', borderRadius: '8px', transition: 'all 0.15s' }}>
                        <Star size={10} style={{ color: '#eab308' }} />Min ★
                        <select value={minRating} onChange={e => setMinRating(Number(e.target.value))} onClick={e => e.stopPropagation()}
                          style={{ backgroundColor: 'transparent', border: 'none', color: '#e4e4e7', fontSize: '0.7rem', cursor: 'pointer', outline: 'none' }}>
                          {[0, 3, 3.5, 4, 4.5].map(n => <option key={n} value={n}>{n === 0 ? 'Any' : n + '+'}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', cursor: 'pointer', color: hasPhone ? '#4ade80' : '#a1a1aa', backgroundColor: hasPhone ? '#14532d' : '#09090b', border: '1px solid ' + (hasPhone ? '#166534' : '#27272a'), padding: '5px 10px', borderRadius: '8px', transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={hasPhone} onChange={e => setHasPhone(e.target.checked)} style={{ display: 'none' }} />
                        <PhoneIcon size={10} />Has phone
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Leads Finder filters */}
            {showLeadsFilters && (
              <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: '#52525b', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building size={9} />Industry</span>
                    </label>
                    <input type="text" value={leadIndustry} onChange={e => setLeadIndustry(e.target.value)} placeholder="SaaS, Fintech..."
                      style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = '#3f3f46'}
                      onBlur={e => e.target.style.borderColor = '#27272a'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: '#52525b', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPinned size={9} />Location</span>
                    </label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="United States, Chicago..."
                      style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = '#3f3f46'}
                      onBlur={e => e.target.style.borderColor = '#27272a'} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: '#52525b', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={9} />Job Titles</span>
                    </label>
                    <input type="text" value={leadJobTitles} onChange={e => setLeadJobTitles(e.target.value)} placeholder="CEO, CTO, Marketing Manager..."
                      style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = '#3f3f46'}
                      onBlur={e => e.target.style.borderColor = '#27272a'} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: '#52525b', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={9} />Company Size</span>
                    </label>
                    <input type="text" value={leadCompanySize} onChange={e => setLeadCompanySize(e.target.value)} placeholder="11-50, 51-200..."
                      style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = '#3f3f46'}
                      onBlur={e => e.target.style.borderColor = '#27272a'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: '#52525b', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={9} />Revenue</span>
                    </label>
                    <input type="text" value={leadRevenue} onChange={e => setLeadRevenue(e.target.value)} placeholder="$1M-$10M, $10M-$50M..."
                      style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = '#3f3f46'}
                      onBlur={e => e.target.style.borderColor = '#27272a'} />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
              <p style={{ flex: 1, fontSize: '0.72rem', color: '#71717a' }}>{active.hint}</p>
              <select value={maxResults} onChange={e => setMaxResults(Number(e.target.value))}
                style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '7px 10px', color: '#a1a1aa', fontSize: '0.72rem', cursor: 'pointer', outline: 'none' }}>
                {tab === 'maps_pro' && [10, 25, 50, 100, 200, 500].map(n => <option key={n} value={n}>{n} places</option>)}
                {tab === 'leads_finder' && [10, 25, 50, 100, 250, 500].map(n => <option key={n} value={n}>{n} leads</option>)}
                {tab === 'search_results' && [10, 25, 50, 100, 200, 500].map(n => <option key={n} value={n}>{n} results</option>)}
              </select>
              <button type="submit" disabled={loading || !input.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.4 : 1, backgroundColor: active.color, color: 'white', whiteSpace: 'nowrap' }}>
                {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={13} />}
                {loading ? 'Scraping...' : 'Scrape'}
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.72rem', marginTop: '10px', backgroundColor: '#7f1d1d', padding: '8px 12px', borderRadius: '8px' }}>
                <X size={10} />{error}
              </div>
            )}
          </div>
        </form>

        {/* Jobs list */}
        <div>
          <h2 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
            Recent Jobs {jobs.length > 0 && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· {jobs.length}</span>}
          </h2>
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '60px', paddingBottom: '60px', color: '#3f3f46' }}>
              <MapPin size={30} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem', color: '#52525b' }}>No scrapes yet — pick a tab and run one</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {jobs.map(job => (
                <JobRow key={job.id} job={job} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
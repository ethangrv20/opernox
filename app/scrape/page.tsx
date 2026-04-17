'use client';
import { useEffect, useState } from 'react';
import { getMcUrl } from '@/lib/mc-url';
import {
  MapPin, Search, Globe, Download, Trash2, Loader2, CheckCircle, XCircle,
  Clock, ChevronDown, Copy, Check, X, Zap, Phone, MapPinned, Star,
  Filter, Wifi, Phone as PhoneIcon, Globe as GlobeIcon, Map, Zap as ZapIcon
} from 'lucide-react';
import { saveAs } from 'file-saver';

type ScrapeType = 'maps_pro' | 'maps' | 'keywords' | 'domain';

const SCRAPE_TYPES = [
  { id: 'maps_pro' as ScrapeType, label: 'Maps Pro', icon: Zap, color: '#f97316', placeholder: 'roofing companies, pizza, restaurants...', hint: '15-30s · Up to 120 results · Apify-powered' },
  { id: 'maps' as ScrapeType, label: 'Maps', icon: MapPin, color: '#ef4444', placeholder: 'roofing companies in new york, dentists in chicago...', hint: '30-60s · Basic Google Maps data' },
  { id: 'keywords' as ScrapeType, label: 'Keywords', icon: Search, color: '#3b82f6', placeholder: 'CRM software, email marketing tools...', hint: 'Under 1 second · Google keyword ideas' },
  { id: 'domain' as ScrapeType, label: 'Domain', icon: Globe, color: '#22c55e', placeholder: 'https://example.com', hint: 'Instant · Meta, contacts, social links' },
];

function downloadCSV(job: any) {
  if (!job.results?.length) return;
  const headers = Object.keys(job.results[0]);
  const csv = [
    headers.join(','),
    ...job.results.map((row: any) =>
      headers.map(h => {
        const v = String(row[h] ?? '');
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
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

  const typeColors: Record<string, string> = { maps_pro: '#f97316', maps: '#ef4444', keywords: '#3b82f6', domain: '#22c55e' };
  const tc = typeColors[job.type] || '#71717a';

  return (
    <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '10px', cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpen(v => !v)}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tc, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.query || job.input_url || '(unnamed)'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.65rem', color: tc, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{job.type === 'maps_pro' ? 'Maps Pro' : job.type}</span>
            <span style={{ color: '#3f3f46', fontSize: '0.65rem' }}>·</span>
            {job.status === 'done' && job.result_count > 0 && (
              <span style={{ fontSize: '0.65rem', color: '#71717a' }}>{job.result_count} results</span>
            )}
            {job.status === 'done' && (!job.result_count || job.result_count === 0) && (
              <span style={{ fontSize: '0.65rem', color: '#52525b' }}>no results</span>
            )}
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
              <p style={{ fontSize: '0.7rem', color: '#3f3f46', marginTop: '4px' }}>Try a different keyword or location.</p>
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
                <span>{data.address}{data.neighborhood ? ` · ${data.neighborhood}` : ''}</span>
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
        {data.hours && (
          <p style={{ fontSize: '0.65rem', color: '#52525b', marginTop: '5px' }}>🕐 {data.hours}</p>
        )}
        {data.latitude && data.longitude && (
          <p style={{ fontSize: '0.65rem', color: '#3f3f46', marginTop: '3px' }}>
            📍 {parseFloat(data.latitude).toFixed(4)}, {parseFloat(data.longitude).toFixed(4)}
          </p>
        )}
      </div>
    );
  }
  if (type === 'maps') {
    return (
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{data.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
              {data.rating && <span style={{ fontSize: '0.72rem', color: '#eab308' }}>★ {data.rating}</span>}
              {data.reviews && <span style={{ fontSize: '0.72rem', color: '#71717a' }}>({data.reviews} reviews)</span>}
            </div>
            {data.address && <p style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPinned size={9} style={{ color: '#52525b' }} />{data.address}</p>}
          </div>
          {data.phone && <button onClick={() => onCopy(data.phone, `phone-${data.name}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#52525b' }}>{copied === `phone-${data.name}` ? <Check size={11} style={{ color: '#4ade80' }} /> : <PhoneIcon size={11} />}</button>}
        </div>
        {data.phone && <p style={{ fontSize: '0.72rem', color: '#d4d4d8', marginTop: '4px' }}>{data.phone}</p>}
      </div>
    );
  }
  if (type === 'keywords') {
    return (
      <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.82rem', color: '#e4e4e7' }}>{data.keyword}</span>
        <button onClick={() => onCopy(data.keyword, `kw-${data.keyword}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#52525b' }}>
          {copied === `kw-${data.keyword}` ? <Check size={10} style={{ color: '#4ade80' }} /> : <Copy size={10} />}
        </button>
      </div>
    );
  }
  // Domain
  return (
    <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
      {data.title && <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{data.title}</p>}
      {data.url && <a href={data.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#60a5fa', textDecoration: 'none' }}>{data.url}</a>}
      {data.description && <p style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '4px' }}>{data.description?.slice(0, 150)}</p>}
      {data.emails?.length > 0 && <p style={{ fontSize: '0.72rem', color: '#d4d4d8', marginTop: '4px' }}>✉ {data.emails.slice(0, 5).join(', ')}</p>}
    </div>
  );
}

export default function ScrapePage() {
  const [tab, setTab] = useState<ScrapeType>('maps_pro');
  const [input, setInput] = useState('');
  const [maxResults, setMaxResults] = useState(120);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [credits, setCredits] = useState<{ balance: number; total_used: number } | null>(null);
  const active = SCRAPE_TYPES.find(t => t.id === tab)!;

  // Maps Pro filters
  const [minRating, setMinRating] = useState(0);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasWebsite, setHasWebsite] = useState(false);

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
      setError('No search credits remaining. Contact support to add more.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body: any = { type: tab };
      if (tab === 'domain') body.input_url = input;
      else body.query = tab === 'maps_pro' ? input : input;
      body.max_results = tab === 'maps_pro' ? (maxResults > 120 ? 120 : maxResults) : maxResults;
      const baseUrl = await getMcUrl();
      const res = await fetch(`${baseUrl}/api/scrape/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Server error — try again.'); }
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      // For maps_pro, results come back immediately
      if (tab === 'maps_pro') {
        // Apply client-side filters to results if any
        let results = data.results || [];
        if (minRating > 0) results = results.filter((r: any) => parseFloat(r.rating || '0') >= minRating);
        if (hasPhone) results = results.filter((r: any) => r.phone && r.phone.trim() !== '');
        if (hasWebsite) results = results.filter((r: any) => r.website && r.website.trim() !== '');
        // Update job with filtered results
        if (results.length !== (data.results || []).length) {
          data.result_count = results.length;
        }
      }
      setInput('');
      await loadJobs();
      await loadCredits();
    } catch (err: any) {
      setError(err.message || err.toString());
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const baseUrl = await getMcUrl();
      await fetch(`${baseUrl}/api/scrape/jobs/${id}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const running = jobs.filter(j => j.status === 'running').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: 'white' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 16px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'white' }}>Scraping Suite</h1>
            <p style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '3px' }}>Maps Pro · Keywords · Domain</p>
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
                <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Credits: </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: credits.balance > 0 ? '#4ade80' : '#f87171' }}>{credits.balance}</span>
                <span style={{ fontSize: '0.65rem', color: '#3f3f46' }}> / {credits.total_used} used</span>
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

            {/* Maps Pro: keyword search */}
            {tab === 'maps_pro' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#71717a', marginBottom: '6px', fontWeight: 500 }}>
                  What are you looking for?
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={active.placeholder}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleScrape(e); } }}
                  style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#3f3f46'}
                  onBlur={e => e.target.style.borderColor = '#27272a'}
                />
              </div>
            )}

            {/* Other tabs: textarea */}
            {tab !== 'maps_pro' && (
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={active.placeholder}
                rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleScrape(e); } }}
                style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '0.875rem', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = '#3f3f46'}
                onBlur={e => e.target.style.borderColor = '#27272a'}
              />
            )}

            {/* Maps Pro: Filters */}
            {tab === 'maps_pro' && (
              <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#71717a', cursor: 'pointer' }}>
                  <Filter size={11} />
                  Filters (applied after results return)
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#a1a1aa', cursor: 'pointer', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '5px 10px', borderRadius: '8px' }}>
                    <Star size={10} style={{ color: '#eab308' }} />
                    <span>Min ★</span>
                    <select value={minRating} onChange={e => setMinRating(Number(e.target.value))}
                      onClick={e => e.stopPropagation()}
                      style={{ backgroundColor: 'transparent', border: 'none', color: '#e4e4e7', fontSize: '0.7rem', cursor: 'pointer', outline: 'none' }}>
                      {[0, 3, 3.5, 4, 4.5].map(n => <option key={n} value={n}>{n === 0 ? 'Any' : n + '+'}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: hasPhone ? '#4ade80' : '#a1a1aa', cursor: 'pointer', backgroundColor: hasPhone ? '#14532d' : '#09090b', border: '1px solid ' + (hasPhone ? '#166534' : '#27272a'), padding: '5px 10px', borderRadius: '8px', transition: 'all 0.15s' }}>
                    <input type="checkbox" checked={hasPhone} onChange={e => setHasPhone(e.target.checked)} style={{ display: 'none' }} />
                    <PhoneIcon size={10} />
                    Has phone
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: hasWebsite ? '#4ade80' : '#a1a1aa', cursor: 'pointer', backgroundColor: hasWebsite ? '#14532d' : '#09090b', border: '1px solid ' + (hasWebsite ? '#166534' : '#27272a'), padding: '5px 10px', borderRadius: '8px', transition: 'all 0.15s' }}>
                    <input type="checkbox" checked={hasWebsite} onChange={e => setHasWebsite(e.target.checked)} style={{ display: 'none' }} />
                    <GlobeIcon size={10} />
                    Has website
                  </label>
                </div>
              </div>
            )}

            {/* Bottom row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p style={{ flex: 1, fontSize: '0.72rem', color: '#71717a' }}>{active.hint}</p>
              {tab !== 'maps_pro' && (
                <select value={maxResults} onChange={e => setMaxResults(Number(e.target.value))}
                  style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '7px 10px', color: '#a1a1aa', fontSize: '0.72rem', cursor: 'pointer', outline: 'none' }}>
                  {[10, 25, 50, 100, 250, 500].map(n => <option key={n} value={n}>{n} results</option>)}
                </select>
              )}
              {tab === 'maps_pro' && (
                <span style={{ fontSize: '0.65rem', color: '#52525b', backgroundColor: '#09090b', border: '1px solid #27272a', padding: '5px 10px', borderRadius: '8px' }}>
                  Max {maxResults} results
                </span>
              )}
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
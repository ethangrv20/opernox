'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

const ACCENT = '#06b6d4';
const SECTIONS = [
  { id: 'basics', label: 'Business Basics' },
  { id: 'offerings', label: 'Offerings & Pricing' },
  { id: 'idealClient', label: 'Ideal Client' },
  { id: 'painPoints', label: 'Pain Points' },
  { id: 'results', label: 'Client Results' },
  { id: 'brand', label: 'Brand Voice' },
  { id: 'market', label: 'Market Context' },
  { id: 'gsc', label: 'Google Search Console' },
];

interface Offering { name: string; price: string; description: string; }
interface Result { metric: string; context: string; details: string; }

function SectionHeader({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; rows?: number;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginBottom: 4, fontWeight: 600 }}>{label}</label>
      {type === 'textarea'
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
      }
    </div>
  );
}

function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px' }}>
      {children}
    </motion.div>
  );
}

export default function ClientConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState('basics');

  // Business basics
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');

  // Offerings
  const [offerings, setOfferings] = useState<Offering[]>([{ name: '', price: '', description: '' }]);

  // Ideal client
  const [clientWho, setClientWho] = useState('');
  const [clientWants, setClientWants] = useState('');
  const [clientStruggles, setClientStruggles] = useState('');

  // Pain points
  const [painPoints, setPainPoints] = useState<string[]>(['', '', '']);

  // Results
  const [results, setResults] = useState<Result[]>([{ metric: '', context: '', details: '' }]);

  // Brand voice
  const [personality, setPersonality] = useState('');
  const [tone, setTone] = useState('');
  const [voiceExamples, setVoiceExamples] = useState('');

  // Market
  const [geography, setGeography] = useState('');
  const [competitors, setCompetitors] = useState('');

  // Google Search Console
  const [gscConnected, setGscConnected] = useState(false);
  const [gscPropertyUrl, setGscPropertyUrl] = useState('');
  const [gscClientId, setGscClientId] = useState('');
  const [gscClientSecret, setGscClientSecret] = useState('');
  const [gscConnecting, setGscConnecting] = useState(false);
  const [gscMsg, setGscMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gscStatus = params.get('gsc');
    if (gscStatus === 'connected') {
      setMsg({ type: 'ok', text: 'Google Search Console connected successfully!' });
      window.history.replaceState({}, '', '/client-config');
    } else if (gscStatus === 'error') {
      const reason = params.get('reason') || 'Connection failed';
      setMsg({ type: 'error', text: `Google connection failed: ${decodeURIComponent(reason)}` });
      window.history.replaceState({}, '', '/client-config');
    }
    fetch('http://127.0.0.1:3337/api/client-config')
      .then(r => r.json())
      .then(data => {
        if (!data.client) { setLoading(false); return; }
        const c = data.client;
        setName(c.name || '');
        setOwnerName(c.ownerName || '');
        setIndustry(c.industry || '');
        setDescription(c.businessDescription || '');
        setOfferings(c.offerings?.length ? c.offerings : [{ name: '', price: '', description: '' }]);
        setClientWho(c.idealClient?.who || '');
        setClientWants(c.idealClient?.wants || '');
        setClientStruggles(c.idealClient?.struggles || '');
        setPainPoints(c.painPoints?.length ? c.painPoints : ['', '', '']);
        setResults(c.results?.length ? c.results : [{ metric: '', context: '', details: '' }]);
        setPersonality(c.brandVoice?.personality || '');
        setTone(c.brandVoice?.tone || '');
        setVoiceExamples(c.brandVoice?.examples || '');
        setGeography(c.targetGeography || '');
        setCompetitors(c.competitors || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Load GSC connection status
    fetch('http://127.0.0.1:3337/api/gsc/status')
      .then(r => r.json())
      .then(data => {
        setGscConnected(!!data.connected);
        setGscPropertyUrl(data.propertyUrl || '');
      })
      .catch(() => {});
  }, []);

  // ─── Google Search Console OAuth ───────────────────────────────────────────
  const startGscOAuth = async () => {
    if (!gscClientId.trim() || !gscClientSecret.trim() || !gscPropertyUrl.trim()) {
      setGscMsg({ type: 'error', text: 'Fill in all three fields above first' });
      return;
    }
    setGscConnecting(true);
    setGscMsg(null);
    try {
      const mcUrl = 'http://127.0.0.1:3337';
      const baseUrl = window.location.origin;
      const redirectUri = `${baseUrl}/api/gsc/callback`;
      const state = JSON.stringify({
        clientId: gscClientId.trim(),
        clientSecret: gscClientSecret.trim(),
        propertyUrl: gscPropertyUrl.trim(),
        mcUrl,
      });
      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
        `client_id=${encodeURIComponent(gscClientId.trim())}` +
        `&response_type=code` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/webmasters.readonly')}` +
        `&state=${encodeURIComponent(state)}`;
      // Open OAuth popup
      const popup = window.open(authUrl, 'gsc_oauth', 'width=600,height=700,scrollbars=yes');
      if (!popup) {
        setGscMsg({ type: 'error', text: 'Popup was blocked — allow popups for this site and try again' });
        setGscConnecting(false);
        return;
      }
      // Poll for the callback result via storage event (same origin)
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Re-check GSC status after popup closes
          fetch(`${mcUrl}/api/gsc/status`)
            .then(r => r.json())
            .then(data => {
              if (data.connected) {
                setGscConnected(true);
                setGscPropertyUrl(data.propertyUrl || gscPropertyUrl);
                setGscMsg({ type: 'ok', text: 'Google Search Console connected!' });
              } else {
                setGscMsg({ type: 'error', text: 'Connection not completed — make sure you clicked "Allow" in the popup' });
              }
              setGscConnecting(false);
            })
            .catch(() => { setGscConnecting(false); });
        }
      }, 500);
    } catch (e: any) {
      setGscMsg({ type: 'error', text: e.message });
      setGscConnecting(false);
    }
  };

  const disconnectGsc = async () => {
    try {
      await fetch('http://127.0.0.1:3337/api/gsc/disconnect', { method: 'DELETE' });
      setGscConnected(false);
      setGscPropertyUrl('');
      setGscClientId('');
      setGscClientSecret('');
      setGscMsg({ type: 'ok', text: 'Google Search Console disconnected' });
    } catch (e: any) {
      setGscMsg({ type: 'error', text: e.message });
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        client: {
          name, ownerName, industry, businessDescription: description,
          offerings: offerings.filter(o => o.name.trim()),
          idealClient: { who: clientWho, wants: clientWants, struggles: clientStruggles },
          painPoints: painPoints.filter(p => p.trim()),
          results: results.filter(r => r.metric.trim() || r.context.trim()),
          brandVoice: { personality, tone, examples: voiceExamples },
          targetGeography: geography,
          competitors,
        }
      };
      const res = await fetch('http://127.0.0.1:3337/api/client-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMsg({ type: 'ok', text: 'Config saved — systems will generate content automatically.' });
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      setMsg({ type: 'error', text: err });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 5000);
  };

  const completion = () => {
    let score = 0;
    if (name.trim()) score++;
    if (industry.trim()) score++;
    if (description.trim()) score++;
    if (offerings.filter(o => o.name.trim()).length) score++;
    if (clientWho.trim() && clientStruggles.trim()) score++;
    if (painPoints.filter(p => p.trim()).length >= 2) score++;
    if (results.filter(r => r.metric.trim()).length) score++;
    if (personality.trim() || tone.trim()) score++;
    return Math.round((score / 8) * 100);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Loading config...</div>
      </div>
    );
  }

  const sections = [
    {
      id: 'basics', label: 'Business Basics', icon: '01',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}><Field label="Business Name" value={name} onChange={setName} placeholder="e.g. Apex Digital Agency" /></div>
          <Field label="Owner / Founder Name" value={ownerName} onChange={setOwnerName} placeholder="e.g. Sarah Chen" />
          <Field label="Industry / Niche" value={industry} onChange={setIndustry} placeholder="e.g. Real estate agents, coaches, e-commerce brands" />
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="What the Business Does" value={description} onChange={setDescription} placeholder="2-3 sentences describing what you offer and who it's for. Think of it as how you'd explain it to someone at a dinner party." type="textarea" rows={3} />
          </div>
        </div>
      )
    },
    {
      id: 'offerings', label: 'Offerings & Pricing', icon: '02',
      content: (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: 12, fontWeight: 600 }}>What do you sell? List each product, service, or package.</div>
          {offerings.map((o, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: 8, marginBottom: 10, alignItems: 'start' }}>
              <input value={o.name} onChange={e => { const s = [...offerings]; s[i] = { ...s[i], name: e.target.value }; setOfferings(s); }} placeholder="Offer name (e.g. Done-For-You Content Package)" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <input value={o.price} onChange={e => { const s = [...offerings]; s[i] = { ...s[i], price: e.target.value }; setOfferings(s); }} placeholder="Price (e.g. $2,500/mo)" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <input value={o.description} onChange={e => { const s = [...offerings]; s[i] = { ...s[i], description: e.target.value }; setOfferings(s); }} placeholder="Short description" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={() => setOfferings(offerings.filter((_, j) => j !== i))} style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0 }}><Trash2 size={13} /></button>
            </div>
          ))}
          <button onClick={() => setOfferings([...offerings, { name: '', price: '', description: '' }])} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 6, border: '1px dashed var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-3)', fontFamily: 'inherit' }}><Plus size={12} /> Add offering</button>
        </div>
      )
    },
    {
      id: 'idealClient', label: 'Ideal Client', icon: '03',
      content: (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: 12, fontWeight: 600 }}>Describe the person who gets the best results from working with you.</div>
          <Field label="Who They Are" value={clientWho} onChange={setClientWho} placeholder="e.g. Real estate agents with 5+ years experience, doing $500k+ in annual volume, who want to scale without working more hours" type="textarea" rows={3} />
          <Field label="What They Want" value={clientWants} onChange={setClientWants} placeholder="e.g. More listings, higher commission checks, passive income, systems that run without them" type="textarea" rows={2} />
          <Field label="What They Struggle With" value={clientStruggles} onChange={setClientStruggles} placeholder="e.g. Spending too much time on manual follow-up, leads going cold, no systematic way to nurture past clients" type="textarea" rows={2} />
        </div>
      )
    },
    {
      id: 'painPoints', label: 'Pain Points', icon: '04',
      content: (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: 12, fontWeight: 600 }}>What problems does your offer solve for them? Be specific — these drive the content engine.</div>
          {painPoints.map((pp, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={pp} onChange={e => { const p = [...painPoints]; p[i] = e.target.value; setPainPoints(p); }} placeholder={`Pain point ${i + 1}`} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              {painPoints.length > 2 && <button onClick={() => setPainPoints(painPoints.filter((_, j) => j !== i))} style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0 }}><Trash2 size={13} /></button>}
            </div>
          ))}
          <button onClick={() => setPainPoints([...painPoints, ''])} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 6, border: '1px dashed var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-3)', fontFamily: 'inherit' }}><Plus size={12} /> Add pain point</button>
        </div>
      )
    },
    {
      id: 'results', label: 'Client Results', icon: '05',
      content: (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: 12, fontWeight: 600 }}>Real outcomes your clients have gotten. These drive social proof posts. Be specific with numbers.</div>
          {results.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, marginBottom: 10, alignItems: 'start' }}>
              <input value={r.metric} onChange={e => { const rs = [...results]; rs[i] = { ...rs[i], metric: e.target.value }; setResults(rs); }} placeholder="e.g. $12k in 30 days" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <input value={r.context} onChange={e => { const rs = [...results]; rs[i] = { ...rs[i], context: e.target.value }; setResults(rs); }} placeholder="e.g. recovered from one re-engagement campaign" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={() => setResults(results.filter((_, j) => j !== i))} style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0 }}><Trash2 size={13} /></button>
            </div>
          ))}
          <textarea value={results[0]?.details || ''} onChange={e => { const rs = [...results]; rs[0] = { ...rs[0], details: e.target.value }; setResults(rs); }} placeholder="Proof details (optional) — e.g. Used a 3-text win-back sequence, 47 dormant clients re-engaged" rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, marginBottom: 10 }} />
          <button onClick={() => setResults([...results, { metric: '', context: '', details: '' }])} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 6, border: '1px dashed var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-3)', fontFamily: 'inherit' }}><Plus size={12} /> Add result</button>
        </div>
      )
    },
    {
      id: 'brand', label: 'Brand Voice', icon: '06',
      content: (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: 12, fontWeight: 600 }}>How does your business sound when it talks? This shapes all content the system generates.</div>
          <Field label="Personality Traits" value={personality} onChange={setPersonality} placeholder="e.g. Direct, no BS, straight-talking. Like a mentor who tells you what you need to hear, not what you want to hear." type="textarea" rows={2} />
          <Field label="Tone" value={tone} onChange={setTone} placeholder="e.g. Conversational, confident, data-driven. Uses numbers and specifics, not vague motivational quotes." type="textarea" rows={2} />
          <Field label="Example Phrases You've Actually Used" value={voiceExamples} onChange={setVoiceExamples} placeholder="Copy-paste 2-3 real things you've said to clients or posted on social. Even rough versions help." type="textarea" rows={3} />
        </div>
      )
    },
    {
      id: 'market', label: 'Market Context', icon: '07',
      content: (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: 12, fontWeight: 600 }}>Where does this business operate? What makes them different?</div>
          <Field label="Target Geography" value={geography} onChange={setGeography} placeholder="e.g. US and Canada, primarily suburban markets. English-speaking only." type="textarea" rows={2} />
          <Field label="Competitors or Alternatives" value={competitors} onChange={setCompetitors} placeholder="How do potential clients solve this problem today? What are they doing instead of hiring you? What makes you different?" type="textarea" rows={3} />
        </div>
      )
    },
    {
      id: 'gsc', label: 'Google Search Console', icon: '08',
      content: (
        <div>
          {gscConnected ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8 }}>
                <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Connected to Google Search Console</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{gscPropertyUrl}</div>
                </div>
                <button onClick={disconnectGsc} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.05)', color: '#f43f5e', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                Your keyword performance data is automatically fetched daily and displayed in the <strong style={{ color: '#e5e7eb' }}>Monitor → Keywords</strong> page.
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: 14, fontWeight: 600, lineHeight: 1.6 }}>
                Connect Google Search Console to see <strong style={{ color: 'var(--text)' }}>real keyword rankings, clicks, and impressions</strong> directly from Google — no extra tools needed, completely free.
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 1 — Get your Google Cloud credentials</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 10 }}>
                  1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>console.cloud.google.com → APIs & Services → Credentials</a><br />
                  2. Create an <strong>OAuth Client ID</strong> (Web application type)<br />
                  3. Add this as an <strong>Authorized Redirect URI</strong>:<br />
                  <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: '#10b981', display: 'block', marginTop: 4 }}>{typeof window !== 'undefined' ? window.location.origin : ''}/api/gsc/callback</code>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
                  4. Copy your <strong>Client ID</strong> and <strong>Client Secret</strong> below
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 2 — Add your website in Search Console</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
                  1. Go to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>search.google.com/search-console</a><br />
                  2. Add your website property (URL prefix, then paste your site URL)<br />
                  3. Verify ownership (e.g. copy the HTML tag Google gives you)<br />
                  4. Your Property URL looks like: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: '#10b981' }}>sc-domain:yourdomain.com</code>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 3 — Connect in Opernox</div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Client ID</label>
                  <input value={gscClientId} onChange={e => setGscClientId(e.target.value)} placeholder="your-client-id.apps.googleusercontent.com"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: 12, color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Client Secret</label>
                  <input value={gscClientSecret} onChange={e => setGscClientSecret(e.target.value)} placeholder="GOCSPX-..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: 12, color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Property URL <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(e.g. sc-domain:yourdomain.com)</span></label>
                  <input value={gscPropertyUrl} onChange={e => setGscPropertyUrl(e.target.value)} placeholder="sc-domain:yourdomain.com"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: 12, color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              {gscMsg && (
                <div style={{ padding: '9px 12px', borderRadius: 6, marginBottom: 10, fontSize: 12, fontWeight: 600, background: gscMsg.type === 'ok' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${gscMsg.type === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`, color: gscMsg.type === 'ok' ? '#10b981' : '#f43f5e' }}>
                  {gscMsg.text}
                </div>
              )}
              <button onClick={startGscOAuth} disabled={gscConnecting}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 8, background: gscConnecting ? 'rgba(6,182,212,0.3)' : '#06b6d1', border: 'none', cursor: gscConnecting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
                {gscConnecting ? 'Opening Google consent screen...' : 'Connect Google Search Console →'}
              </button>
              <div style={{ fontSize: 11, color: '#4b5563', textAlign: 'center', marginTop: 8 }}>
                You'll see a Google popup — just click "Allow" and it auto-connects
              </div>
            </div>
          )}
        </div>
      )
    },
  ];

  const current = sections.find(s => s.id === activeSection) || sections[0];
  const pct = completion();

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Client Config</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {pct === 100
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981' }}><CheckCircle size={12} /> Config complete</span>
            : <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={12} /> {pct}% complete</span>
          }
          <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10b981' : ACCENT, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Business Intelligence</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Describe the business once. The system generates X posts, UGC scripts, LinkedIn content, outreach, and more — automatically.</div>
        </motion.div>

        {msg && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 7, background: msg.type === 'ok' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${msg.type === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`, fontSize: '12.5px', fontWeight: 600, color: msg.type === 'ok' ? '#10b981' : '#f43f5e' }}>
            {msg.type === 'ok' ? <CheckCircle size={13} style={{ display: 'inline', marginRight: 6 }} /> : <AlertTriangle size={13} style={{ display: 'inline', marginRight: 6 }} />}{msg.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Left nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 7,
                  border: '1px solid',
                  borderColor: activeSection === s.id ? (ACCENT + '44') : 'transparent',
                  background: activeSection === s.id ? (ACCENT + '0d') : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: activeSection === s.id ? ACCENT : 'var(--text-4)', width: 20, flexShrink: 0 }}>{s.icon}</span>
                <span style={{ fontSize: '12.5px', fontWeight: activeSection === s.id ? 700 : 500, color: activeSection === s.id ? 'var(--text)' : 'var(--text-2)' }}>{s.label}</span>
                {activeSection === s.id && <ChevronRight size={12} style={{ marginLeft: 'auto', color: ACCENT }} />}
              </button>
            ))}
          </div>

          {/* Right content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card delay={0.05}>
              {current.content}
            </Card>

            {/* Nav buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => { const idx = sections.findIndex(s => s.id === activeSection); if (idx > 0) setActiveSection(sections[idx - 1].id); }}
                disabled={sections[0].id === activeSection}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: sections[0].id === activeSection ? 'not-allowed' : 'pointer', fontSize: '12px', color: sections[0].id === activeSection ? 'var(--text-4)' : 'var(--text-2)', fontFamily: 'inherit', opacity: sections[0].id === activeSection ? 0.4 : 1 }}>
                ← Previous
              </button>
              <button
                onClick={() => { const idx = sections.findIndex(s => s.id === activeSection); if (idx < sections.length - 1) setActiveSection(sections[idx + 1].id); }}
                disabled={sections[sections.length - 1].id === activeSection}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: sections[sections.length - 1].id === activeSection ? 'not-allowed' : 'pointer', fontSize: '12px', color: sections[sections.length - 1].id === activeSection ? 'var(--text-4)' : 'var(--text-2)', fontFamily: 'inherit', opacity: sections[sections.length - 1].id === activeSection ? 0.4 : 1 }}>
                Next →
              </button>
            </div>

            {/* Save */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={save}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 7, background: ACCENT, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
              <Save size={13} /> {saving ? 'Saving...' : 'Save Config'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

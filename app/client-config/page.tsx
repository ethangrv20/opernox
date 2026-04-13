'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ACCENT = '#06b6d4';

interface ClientConfig {
  name: string;
  product: string;
  cta: string;
  keywords: string[];
  painPoints: string[];
  results: { metric: string; context: string; details: string }[];
  articleTopics: string[];
  captions: string[];
}

const emptyConfig = (): ClientConfig => ({
  name: '',
  product: '',
  cta: '',
  keywords: ['', ''],
  painPoints: ['', ''],
  results: [{ metric: '', context: '', details: '' }],
  articleTopics: ['', '', '', '', ''],
  captions: ['', ''],
});

export default function ClientConfigPage() {
  const [config, setConfig] = useState<ClientConfig>(emptyConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [validation, setValidation] = useState<{ morning: string | null; midday: string | null; evening: string | null } | null>(null);

  // Load config from server.js
  useEffect(() => {
    fetch('http://127.0.0.1:3337/api/client-config')
      .then(r => r.json())
      .then(data => {
        if (data.client) {
          setConfig({
            name: data.client.name || '',
            product: data.client.product || '',
            cta: data.client.cta || '',
            keywords: data.client.keywords || ['', ''],
            painPoints: data.client.painPoints || ['', ''],
            results: data.client.results?.length ? data.client.results : [{ metric: '', context: '', details: '' }],
            articleTopics: data.client.articleTopics?.length ? data.client.articleTopics : ['', '', '', '', ''],
            captions: data.client.captions || ['', ''],
          });
        }
        // Also load validation if present
        if (data.validation) setValidation(data.validation);
      })
      .catch(() => {
        // Server not reachable — try via Next.js API route instead
        fetch('/api/client-config')
          .then(r => r.json())
          .then(data => {
            if (data.client) {
              setConfig({
                name: data.client.name || '',
                product: data.client.product || '',
                cta: data.client.cta || '',
                keywords: data.client.keywords || ['', ''],
                painPoints: data.client.painPoints || ['', ''],
                results: data.client.results?.length ? data.client.results : [{ metric: '', context: '', details: '' }],
                articleTopics: data.client.articleTopics?.length ? data.client.articleTopics : ['', '', '', '', ''],
                captions: data.client.captions || ['', ''],
              });
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (field: keyof ClientConfig, value: unknown) => {
    setConfig(c => ({ ...c, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('http://127.0.0.1:3337/api/client-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMsg({ type: 'ok', text: 'Config saved!' });
      // Reload validation
      const vres = await fetch('http://127.0.0.1:3337/api/client-config/validate').catch(() => null);
      if (vres?.ok) {
        const vdata = await vres.json();
        if (vdata.warnings) setValidation(vdata.warnings);
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      setMsg({ type: 'error', text: err });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 4000);
  };

  const isValid = () => {
    const c = config;
    return (
      c.name.trim() &&
      c.product.trim() &&
      c.cta.trim() &&
      c.keywords[0]?.trim() &&
      c.painPoints[1]?.trim() &&
      c.results[0]?.metric?.trim() &&
      c.results[0]?.context?.trim() &&
      c.articleTopics.filter(t => t.trim()).length >= 5
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Loading config...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Client Config</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
          {isValid()
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981' }}><CheckCircle size={12} /> Config complete — auto-post ready</span>
            : <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-3)' }}><AlertTriangle size={12} /> Complete all fields to enable auto-post</span>
          }
        </div>
      </div>

      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Content Generation Settings</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>This config drives the auto-post content for Morning, Midday, and Evening posts.</div>
        </motion.div>

        {msg && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: msg.type === 'ok' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${msg.type === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`, fontSize: '12px', fontWeight: 600, color: msg.type === 'ok' ? '#10b981' : '#f43f5e' }}>
            {msg.type === 'ok' ? <CheckCircle size={12} style={{ display: 'inline', marginRight: 6 }} /> : <AlertTriangle size={12} style={{ display: 'inline', marginRight: 6 }} />}{msg.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, alignItems: 'start' }}>
          {/* Main form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Identity */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Business Identity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: '11.5px', color: 'var(--text-2)', marginBottom: 2 }}>Business / Client Name</label>
                <input value={config.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Apex Digital" style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                <label style={{ fontSize: '11.5px', color: 'var(--text-2)', marginBottom: 2 }}>Product / Service</label>
                <input value={config.product} onChange={e => set('product', e.target.value)} placeholder="e.g. Done-for-you content creation for agencies" style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                <label style={{ fontSize: '11.5px', color: 'var(--text-2)', marginBottom: 2 }}>CTA (Call to Action)</label>
                <input value={config.cta} onChange={e => set('cta', e.target.value)} placeholder="e.g. Reply 'HELLO' and I'll send you the exact sequence" style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </motion.div>

            {/* Keywords */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Keywords</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {config.keywords.map((kw, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input value={kw} onChange={e => { const k = [...config.keywords]; k[i] = e.target.value; set('keywords', k); }} placeholder={`Keyword ${i + 1}`} style={{ flex: 1, padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    {config.keywords.length > 1 && <button onClick={() => set('keywords', config.keywords.filter((_, j) => j !== i))} style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)' }}><Trash2 size={12} /></button>}
                  </div>
                ))}
                <button onClick={() => set('keywords', [...config.keywords, ''])} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-3)', fontFamily: 'inherit' }}><Plus size={11} /> Add keyword</button>
              </div>
            </motion.div>

            {/* Pain Points */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Pain Points <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(used in morning tips)</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {config.painPoints.map((pp, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input value={pp} onChange={e => { const p = [...config.painPoints]; p[i] = e.target.value; set('painPoints', p); }} placeholder={`Pain point ${i + 1}`} style={{ flex: 1, padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    {config.painPoints.length > 2 && <button onClick={() => set('painPoints', config.painPoints.filter((_, j) => j !== i))} style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)' }}><Trash2 size={12} /></button>}
                  </div>
                ))}
                <button onClick={() => set('painPoints', [...config.painPoints, ''])} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-3)', fontFamily: 'inherit' }}><Plus size={11} /> Add pain point</button>
              </div>
            </motion.div>

            {/* Results */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Client Results <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(used in evening posts)</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {config.results.map((r, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
                    <input value={r.metric} onChange={e => { const rs = [...config.results]; rs[i] = { ...rs[i], metric: e.target.value }; set('results', rs); }} placeholder="e.g. $12k" style={{ padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    <input value={r.context} onChange={e => { const rs = [...config.results]; rs[i] = { ...rs[i], context: e.target.value }; set('results', rs); }} placeholder="e.g. recovered from one campaign" style={{ padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <textarea value={config.results[0]?.details || ''} onChange={e => { const rs = [...config.results]; rs[0] = { ...rs[0], details: e.target.value }; set('results', rs); }} placeholder="Details / proof point" rows={2} style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </motion.div>

            {/* Article Topics */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Article Topics <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(min 5 — used in midday posts)</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {config.articleTopics.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-4)', width: 20, paddingTop: 7 }}>{i + 1}.</span>
                    <input value={t} onChange={e => { const top = [...config.articleTopics]; top[i] = e.target.value; set('articleTopics', top); }} placeholder={`Topic ${i + 1}`} style={{ flex: 1, padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Captions */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>TikTok Captions <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(used for Reels/video shorts)</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {config.captions.map((cap, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <input value={cap} onChange={e => { const c = [...config.captions]; c[i] = e.target.value; set('captions', c); }} placeholder={`Caption ${i + 1}`} style={{ flex: 1, padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', background: 'var(--surface-2)', fontSize: '12.5px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    {config.captions.length > 1 && <button onClick={() => set('captions', config.captions.filter((_, j) => j !== i))} style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)' }}><Trash2 size={12} /></button>}
                  </div>
                ))}
                <button onClick={() => set('captions', [...config.captions, ''])} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-3)', fontFamily: 'inherit' }}><Plus size={11} /> Add caption</button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar — status + save */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 16 }}>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Auto-Post Status</div>
              {[
                { label: 'Morning Tips', ok: !!(config.painPoints[1]?.trim() && config.keywords[0]?.trim() && config.cta?.trim()) },
                { label: 'Evening Results', ok: !!(config.results[0]?.metric?.trim() && config.results[0]?.context?.trim()) },
                { label: 'Midday Articles', ok: !!(config.articleTopics.filter(t => t.trim()).length >= 5) },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.ok ? '#10b981' : '#f43f5e' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{item.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Next Steps</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-3)', lineHeight: 1.6 }}>
                  1. Complete this form<br />
                  2. Click Save Config<br />
                  3. Go to X System → toggle Morning/Midday/Evening ON<br />
                  4. Agent auto-posts daily
                </div>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={save}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, color: 'white', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
              <Save size={13} /> {saving ? 'Saving...' : 'Save Config'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getMcUrl } from '@/lib/mc-url';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Trash2, User, Instagram, Music, Linkedin, Twitter,
  CheckCircle, AlertCircle, Globe, Wifi, Loader2, RefreshCw, Send
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type AccountSystem = 'ig_ugc' | 'ig_outreach' | 'tiktok_ugc' | 'x' | 'linkedin';

interface Account {
  id: string;
  name: string;
  adspower_id: string;
  account_system: AccountSystem;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_user: string | null;
  proxy_pass: string | null;
  status: 'active' | 'paused' | 'error';
  warmup_start_date: string | null;
  daily_limit: number;
  created_at: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const SYSTEMS: {
  value: AccountSystem;
  label: string;
  icon: React.ReactNode;
  color: string;
  platform_label: string;
}[] = [
  { value: 'ig_ugc',     label: 'IG UGC',      icon: <Instagram size={14} />, color: '#e1306c', platform_label: 'Instagram' },
  { value: 'ig_outreach', label: 'IG Outreach', icon: <Send size={14} />,     color: '#fd1d83', platform_label: 'Instagram' },
  { value: 'tiktok_ugc', label: 'TikTok UGC',  icon: <Music size={14} />,    color: '#ff0050', platform_label: 'TikTok' },
  { value: 'x',          label: 'X',            icon: <Twitter size={14} />,  color: '#1da1f2', platform_label: 'X' },
  { value: 'linkedin',   label: 'LinkedIn',    icon: <Linkedin size={14} />,  color: '#0a66c2', platform_label: 'LinkedIn' },
];

// Maps system → platform for Supabase storage
const SYSTEM_TO_PLATFORM: Record<AccountSystem, string> = {
  ig_ugc:     'instagram',
  ig_outreach: 'instagram',
  tiktok_ugc: 'tiktok',
  x:          'x',
  linkedin:   'linkedin',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function systemInfo(s: AccountSystem) {
  return SYSTEMS.find(x => x.value === s) ?? SYSTEMS[0];
}
function getDaysActive(startDate: string | null) {
  if (!startDate) return 0;
  return Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Test Connection ──────────────────────────────────────────────────────────
type TestStatus = 'idle' | 'testing' | 'ok' | 'fail';

function TestConnectionBtn({
  mcUrl,
  adspower_id,
  proxy_host,
  proxy_port,
  proxy_user,
  proxy_pass,
}: {
  mcUrl: string;
  adspower_id: string;
  proxy_host: string;
  proxy_port: string | number;
  proxy_user: string;
  proxy_pass: string;
}) {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [msg, setMsg] = useState('');

  const test = async () => {
    if (!adspower_id.trim()) { setMsg('Enter AdsPower ID first'); setStatus('fail'); return; }
    setStatus('testing');
    setMsg('');
    try {
      const res = await fetch(mcUrl + '/api/adspower/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: adspower_id.trim(),
          proxy_host: proxy_host.trim() || undefined,
          proxy_port: proxy_port ? parseInt(String(proxy_port)) : undefined,
          proxy_user: proxy_user.trim() || undefined,
          proxy_pass: proxy_pass || undefined,
        }),
      });
      const d = await res.json();
      if (d.success) { setStatus('ok'); setMsg(d.message || 'Connected!'); }
      else { setStatus('fail'); setMsg(d.error || 'Connection failed'); }
    } catch {
      setStatus('fail'); setMsg('Cannot reach MC server');
    }
  };

  return (
    <div className="test-conn">
      <button
        type="button"
        className={`test-conn__btn test-conn__btn--${status}`}
        onClick={test}
        disabled={status === 'testing'}
      >
        {status === 'testing' ? (
          <><Loader2 size={12} className="spin" /> Testing...</>
        ) : status === 'ok' ? (
          <><CheckCircle size={12} /> Connected</>
        ) : status === 'fail' ? (
          <><AlertCircle size={12} /> Failed — Retry</>
        ) : (
          <><Wifi size={12} /> Test Connection</>
        )}
      </button>
      {msg && (
        <span className={`test-conn__msg test-conn__msg--${status}`}>{msg}</span>
      )}
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function AccountModal({
  existing,
  onClose,
  onSaved,
  mcUrl,
}: {
  existing?: Account;
  onClose: () => void;
  onSaved: () => void;
  mcUrl: string;
}) {
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    adspower_id: existing?.adspower_id ?? '',
    account_system: existing?.account_system ?? ('ig_ugc' as AccountSystem),
    proxy_host: existing?.proxy_host ?? '',
    proxy_port: String(existing?.proxy_port ?? ''),
    proxy_user: existing?.proxy_user ?? '',
    proxy_pass: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const payload: any = {
        user_id: user.id,
        name: form.name,
        adspower_id: form.adspower_id,
        platform: SYSTEM_TO_PLATFORM[form.account_system],
        account_system: form.account_system,
        proxy_host: form.proxy_host || null,
        proxy_port: form.proxy_port ? parseInt(String(form.proxy_port)) : null,
        proxy_user: form.proxy_user || null,
        status: 'active',
      };
      if (!existing) {
        payload.warmup_start_date = new Date().toISOString();
        payload.daily_limit = 5;
      }
      if (form.proxy_pass) payload.proxy_pass = form.proxy_pass;

      const { error: err } = existing
        ? await supabase.from('accounts').update(payload).eq('id', existing.id)
        : await supabase.from('accounts').insert(payload);
      if (err) throw err;
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sinfo = systemInfo(form.account_system);

  return (
    <div className="acc-overlay" onClick={onClose}>
      <motion.div
        className="acc-modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="acc-modal__hd">
          <h3>{existing ? 'Edit Account' : 'Add Account'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="sys-badge" style={{ color: sinfo.color, background: sinfo.color + '18', borderColor: sinfo.color + '35' }}>
              {sinfo.icon} {sinfo.label}
            </div>
            <button className="acc-modal__close" onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        {error && <div className="auth-err" style={{ margin: '0 20px 14px' }}>{error}</div>}

        <form className="acc-modal__body" onSubmit={handleSubmit}>

          {/* System selector — the ONE choice */}
          <div className="field">
            <label className="field-label">System</label>
            <div className="sys-grid">
              {SYSTEMS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, account_system: s.value }))}
                  className={`sys-btn ${form.account_system === s.value ? 'sys-btn--active' : ''}`}
                  style={{ '--s-color': s.color } as React.CSSProperties}
                >
                  <span className="sys-btn__icon">{s.icon}</span>
                  <span className="sys-btn__label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <div className="field">
            <label className="field-label">Display name <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(internal label)</span></label>
            <input
              className="field-input"
              placeholder="e.g. Fitness UGC or Real Estate Outreach"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          {/* AdsPower ID + test */}
          <div className="field">
            <label className="field-label">AdsPower Profile ID</label>
            <input
              className="field-input"
              placeholder="e.g. k19selk6"
              value={form.adspower_id}
              onChange={e => setForm(f => ({ ...f, adspower_id: e.target.value }))}
              required
            />
            <TestConnectionBtn
              mcUrl={mcUrl}
              adspower_id={form.adspower_id}
              proxy_host={form.proxy_host}
              proxy_port={form.proxy_port}
              proxy_user={form.proxy_user}
              proxy_pass={form.proxy_pass}
            />
          </div>

          {/* Proxy */}
          <div className="field">
            <label className="field-label">Proxy <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(optional but recommended)</span></label>
            <div className="field-row-2">
              <input className="field-input" placeholder="Host — e.g. 207.135.197.155" value={form.proxy_host}
                onChange={e => setForm(f => ({ ...f, proxy_host: e.target.value }))} />
              <input className="field-input" placeholder="Port — e.g. 6096" value={form.proxy_port}
                onChange={e => setForm(f => ({ ...f, proxy_port: e.target.value }))} />
            </div>
            <input className="field-input" style={{ marginTop: 8 }} placeholder="Username (if auth required)" value={form.proxy_user}
              onChange={e => setForm(f => ({ ...f, proxy_user: e.target.value }))} />
            <input className="field-input" style={{ marginTop: 8 }} type="password" placeholder="Password (if auth required)" value={form.proxy_pass}
              onChange={e => setForm(f => ({ ...f, proxy_pass: e.target.value }))} />
          </div>

          <div className="acc-modal__foot">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner-sm" /> : <><Plus size={14} /> {existing ? 'Save Changes' : 'Add Account'}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Account Card ─────────────────────────────────────────────────────────────
function AccountCard({ account, onEdit, onDelete }: {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sinfo = systemInfo(account.account_system as AccountSystem);
  const days = getDaysActive(account.warmup_start_date);
  const isIg = account.account_system === 'ig_ugc' || account.account_system === 'ig_outreach';

  return (
    <motion.div
      className="acc-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="acc-card__head">
        <div className="acc-card__icon" style={{ background: sinfo.color + '20', borderColor: sinfo.color + '40', color: sinfo.color }}>
          {sinfo.icon}
        </div>
        <div className="acc-card__info">
          <div className="acc-card__name">{account.name}</div>
          <div className="acc-card__adspower">{account.adspower_id}</div>
        </div>
        <div className={`acc-status acc-status--${account.status}`}>
          <span className="acc-status__dot" />
          {account.status}
        </div>
      </div>

      {/* Tags */}
      <div className="acc-card__tags">
        <span className="acc-tag" style={{ color: sinfo.color, background: sinfo.color + '14', borderColor: sinfo.color + '30' }}>
          {sinfo.icon} {sinfo.label}
        </span>
        {account.proxy_host ? (
          <span className="acc-tag acc-tag--proxy">
            <Globe size={10} /> {account.proxy_host}:{account.proxy_port}
          </span>
        ) : (
          <span className="acc-tag acc-tag--nopxy">No proxy</span>
        )}
      </div>

      {/* Stats */}
      {isIg && (
        <div className="acc-card__stats">
          <div className="acc-stat">
            <div className="acc-stat__num" style={{ color: sinfo.color }}>Day {Math.min(days + 1, 40)}</div>
            <div className="acc-stat__label">Warmup</div>
          </div>
          <div className="acc-stat__sep" />
          <div className="acc-stat">
            <div className="acc-stat__num" style={{ color: '#a78bfa' }}>{account.daily_limit}/day</div>
            <div className="acc-stat__label">Limit</div>
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="acc-card__meta">Added {formatDate(account.created_at)}</div>

      {/* Actions */}
      <div className="acc-card__actions">
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>
          <RefreshCw size={11} /> Edit
        </button>
        <button className="btn btn-danger-ghost btn-sm" onClick={onDelete}>
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | undefined>();
  const [mcUrl, setMcUrl] = useState('http://127.0.0.1:3337');

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setAccounts((data as Account[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  useEffect(() => {
    getMcUrl().then(setMcUrl);
  }, []);

  const deleteAccount = async (id: string) => {
    if (!confirm('Remove this account? This cannot be undone.')) return;
    await supabase.from('accounts').delete().eq('id', id);
    fetchAccounts();
  };

  const counts = SYSTEMS.reduce((acc, s) => {
    acc[s.value] = accounts.filter(a => a.account_system === s.value).length;
    return acc;
  }, {} as Record<AccountSystem, number>);

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Accounts</div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditAccount(undefined); setShowAdd(true); }}>
          <Plus size={14} /> Add Account
        </button>
      </div>

      <div className="page-content">

        {/* System filter tabs */}
        <div className="acc-tabs">
          <div className="acc-tabs__filter">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span className="acc-tabs__filter-label">Filter</span>
          </div>
          <button onClick={() => {}} className={`acc-tab acc-tab--active`} style={{ '--tab-color': '#8b5cf6' } as React.CSSProperties}>
            All ({accounts.length})
          </button>
          {SYSTEMS.map(s => (
            <button
              key={s.value}
              onClick={() => {}}
              className={`acc-tab`}
              style={{ '--tab-color': s.color } as React.CSSProperties}
            >
              {s.icon} {s.label} ({counts[s.value] ?? 0})
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="acc-loading">
            <div className="spinner" style={{ width: 26, height: 26 }} />
          </div>
        ) : accounts.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><User size={22} /></div>
            <h3>No accounts yet</h3>
            <p>Add your first AdsPower account to connect a platform system.</p>
            <button className="btn btn-primary" onClick={() => { setEditAccount(undefined); setShowAdd(true); }}>
              <Plus size={14} /> Add account
            </button>
          </div>
        ) : (
          <div className="acc-grid">
            {accounts.map((a, i) => (
              <div key={a.id} style={{ animationDelay: `${i * 50}ms` }}>
                <AccountCard
                  account={a}
                  onEdit={() => { setEditAccount(a); setShowAdd(true); }}
                  onDelete={() => deleteAccount(a.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <AccountModal
            existing={editAccount}
            mcUrl={mcUrl}
            onClose={() => { setShowAdd(false); setEditAccount(undefined); }}
            onSaved={fetchAccounts}
          />
        )}
      </AnimatePresence>

      <style>{`
        /* ── Modal ── */
        .acc-overlay {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(0,0,0,0.65);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        .acc-modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: 100%; max-width: 480px;
          max-height: 92vh;
          display: flex; flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
        }
        .acc-modal__hd {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 0;
        }
        .acc-modal__hd h3 { font-size: 15px; font-weight: 800; color: var(--text-1); margin: 0; }
        .acc-modal__close { background: none; border: none; cursor: pointer; color: var(--text-3); padding: 4px; border-radius: 6px; transition: all 0.15s; }
        .acc-modal__close:hover { background: var(--surface-2); color: var(--text-1); }
        .acc-modal__body { padding: 18px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; flex: 1; }
        .acc-modal__foot { display: flex; gap: 10px; padding-top: 4px; }
        .acc-modal__foot .btn { flex: 1; justify-content: center; }

        /* ── System badge (shown after selection) ── */
        .sys-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 99; font-size: 11.5px; font-weight: 700; border: 1px solid; }

        /* ── Fields ── */
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field-label { font-size: 11.5px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
        .field-input { width: 100%; padding: 9px 12px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; color: var(--text-1); font-size: 13px; font-family: inherit; box-sizing: border-box; transition: border-color 0.15s; }
        .field-input:focus { outline: none; border-color: #8b5cf6; }
        .field-input::placeholder { color: var(--text-4); }
        .field-row-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 8px; }

        /* ── System selector (the ONE choice) ── */
        .sys-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .sys-btn { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px 4px; border-radius: 10px; border: 1.5px solid var(--border); background: transparent; color: var(--text-3); cursor: pointer; font-size: 10.5px; font-weight: 700; transition: all 0.15s; font-family: inherit; }
        .sys-btn:hover { border-color: var(--s-color, var(--border-2)); color: var(--s-color); }
        .sys-btn--active { border-color: var(--s-color); background: color-mix(in srgb, var(--s-color) 14%, transparent); color: var(--s-color); }
        .sys-btn__icon { }
        .sys-btn__label { }

        /* ── Test connection ── */
        .test-conn { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
        .test-conn__btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px; border-radius: 7px; border: 1.5px solid var(--border); background: transparent; font-size: 11.5px; font-weight: 700; cursor: pointer; transition: all 0.15s; font-family: inherit; color: var(--text-2); }
        .test-conn__btn:hover { border-color: var(--border-2); }
        .test-conn__btn--testing { opacity: 0.7; cursor: default; }
        .test-conn__btn--ok { border-color: #10b981; color: #10b981; background: rgba(16,185,129,0.08); }
        .test-conn__btn--fail { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.08); }
        .test-conn__msg { font-size: 11.5px; font-weight: 600; }
        .test-conn__msg--ok { color: #10b981; }
        .test-conn__msg--fail { color: #ef4444; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Spinner ── */
        .spinner-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.2); border-top-color: black; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Account Card ── */
        .acc-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 13px; }
        .acc-card__head { display: flex; align-items: center; gap: 12px; }
        .acc-card__icon { width: 42px; height: 42px; border-radius: 11px; border: 1.5px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .acc-card__info { flex: 1; min-width: 0; }
        .acc-card__name { font-weight: 700; font-size: 14px; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .acc-card__adspower { font-size: 11px; color: var(--text-3); font-family: monospace; margin-top: 1px; }

        .acc-status { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 99; font-size: 11px; font-weight: 600; flex-shrink: 0; }
        .acc-status__dot { width: 5px; height: 5px; border-radius: 50%; }
        .acc-status--active { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
        .acc-status--active .acc-status__dot { background: #10b981; }
        .acc-status--paused { background: rgba(245,158,11,0.12); color: #f5910f; border: 1px solid rgba(245,158,11,0.25); }
        .acc-status--paused .acc-status__dot { background: #f5910f; }
        .acc-status--error { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
        .acc-status--error .acc-status__dot { background: #ef4444; }

        .acc-card__tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .acc-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 99; font-size: 11.5px; font-weight: 600; border: 1px solid; }
        .acc-tag--nopxy { color: var(--text-4); background: var(--surface-2); border-color: var(--border); }
        .acc-tag--proxy { color: var(--text-3); background: var(--surface-2); border-color: var(--border); font-family: monospace; font-size: 11px; }

        .acc-card__stats { display: flex; align-items: center; gap: 0; background: var(--bg); border-radius: 8px; padding: 10px 14px; }
        .acc-stat { flex: 1; }
        .acc-stat__num { font-size: 15px; font-weight: 800; }
        .acc-stat__label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px; }
        .acc-stat__sep { width: 1px; height: 28px; background: var(--border); margin: 0 12px; }

        .acc-card__meta { font-size: 11px; color: var(--text-3); }
        .acc-card__actions { display: flex; gap: 8px; }
        .acc-card__actions .btn { flex: 1; justify-content: center; font-size: 12px; }

        /* ── Tabs ── */
        .acc-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .acc-tabs__filter { display: flex; align-items: center; gap: 5px; margin-right: 4px; }
        .acc-tabs__filter-label { font-size: 11.5px; color: var(--text-3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .acc-tab { padding: 5px 12px; border-radius: 99; font-size: 12px; font-weight: 600; border: 1.5px solid var(--border); background: transparent; color: var(--text-2); cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s; font-family: inherit; }
        .acc-tab:hover { border-color: var(--border-2); }
        .acc-tab--active { border-color: var(--tab-color, var(--text-2)); background: color-mix(in srgb, var(--tab-color, var(--text-2)) 12%, transparent); color: var(--tab-color, var(--text-2)); }

        /* ── Grid / loading / empty ── */
        .acc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 14px; }
        .acc-loading { display: flex; justify-content: center; padding: 80px; }

        .btn-sm { padding: 6px 12px !important; font-size: 12px !important; }
        .btn-danger-ghost { background: rgba(239,68,68,0.08); color: #f87171; border: 1px solid rgba(239,68,68,0.2); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: all 0.15s; font-family: inherit; flex: 1; justify-content: center; }
        .btn-danger-ghost:hover { background: rgba(239,68,68,0.15); }
      `}</style>
    </div>
  );
}
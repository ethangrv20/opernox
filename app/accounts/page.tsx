'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Trash2, User, Instagram, Music, Linkedin, Twitter,
  CheckCircle, AlertCircle, Globe, Zap, Filter, Layers, Send
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Platform = 'instagram' | 'tiktok' | 'linkedin' | 'x';
type AccountSystem = 'ugc' | 'outreach' | 'content' | 'scraper';

interface Account {
  id: string;
  name: string;
  adspower_id: string;
  platform: Platform;
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

const PLATFORMS: { value: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'instagram', label: 'Instagram',  icon: <Instagram size={13} />,  color: '#e1306c' },
  { value: 'tiktok',    label: 'TikTok',      icon: <Music size={13} />,     color: '#ff0050' },
  { value: 'linkedin',  label: 'LinkedIn',    icon: <Linkedin size={13} />, color: '#0a66c2' },
  { value: 'x',         label: 'X',           icon: <Twitter size={13} />,  color: '#1da1f2' },
];

const SYSTEMS: { value: AccountSystem; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'ugc',      label: 'UGC',       desc: 'Post videos & reels',          icon: <Layers size={12} /> },
  { value: 'outreach', label: 'Outreach',  desc: 'DM leads & follow-ups',       icon: <Send size={12} /> },
  { value: 'content',  label: 'Content',   desc: 'Feed posts & stories',        icon: <Zap size={12} /> },
  { value: 'scraper',  label: 'Scraper',   desc: 'Data extraction & monitoring', icon: <Globe size={12} /> },
];

const STATUS_OPTIONS = ['active', 'paused', 'error'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function platformInfo(p: Platform) {
  return PLATFORMS.find(x => x.value === p) ?? PLATFORMS[0];
}
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

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function AccountModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Account;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    adspower_id: existing?.adspower_id ?? '',
    platform: existing?.platform ?? ('instagram' as Platform),
    account_system: existing?.account_system ?? ('ugc' as AccountSystem),
    proxy_host: existing?.proxy_host ?? '',
    proxy_port: existing?.proxy_port ?? '',
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
        platform: form.platform,
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

  const platform = platformInfo(form.platform);

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
          <button className="acc-modal__close" onClick={onClose}><X size={15} /></button>
        </div>

        {error && <div className="auth-err" style={{ margin: '0 20px 14px' }}>{error}</div>}

        <form className="acc-modal__body" onSubmit={handleSubmit}>

          {/* Platform */}
          <div className="field">
            <label className="field-label">Platform</label>
            <div className="platform-row">
              {PLATFORMS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, platform: p.value }))}
                  className={`platform-btn ${form.platform === p.value ? 'platform-btn--active' : ''}`}
                  style={{ '--p-color': p.color } as React.CSSProperties}
                >
                  {p.icon}<span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* System */}
          <div className="field">
            <label className="field-label">System</label>
            <div className="system-grid">
              {SYSTEMS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, account_system: s.value }))}
                  className={`system-btn ${form.account_system === s.value ? 'system-btn--active' : ''}`}
                >
                  <span className="system-btn__icon">{s.icon}</span>
                  <span className="system-btn__label">{s.label}</span>
                  <span className="system-btn__desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <div className="field">
            <label className="field-label">Display name</label>
            <input
              className="field-input"
              placeholder="e.g. Fitness Outreach or UGC Busness"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          {/* AdsPower ID */}
          <div className="field">
            <label className="field-label">AdsPower Profile ID</label>
            <input
              className="field-input"
              placeholder="e.g. k19selk6"
              value={form.adspower_id}
              onChange={e => setForm(f => ({ ...f, adspower_id: e.target.value }))}
              required
            />
          </div>

          {/* Proxy */}
          <div className="field">
            <label className="field-label">Proxy</label>
            <div className="field-row-2">
              <input className="field-input" placeholder="Host" value={form.proxy_host}
                onChange={e => setForm(f => ({ ...f, proxy_host: e.target.value }))} />
              <input className="field-input" placeholder="Port" value={form.proxy_port}
                onChange={e => setForm(f => ({ ...f, proxy_port: e.target.value }))} />
            </div>
            <input className="field-input" style={{ marginTop: 8 }} placeholder="Username (optional)" value={form.proxy_user}
              onChange={e => setForm(f => ({ ...f, proxy_user: e.target.value }))} />
            <input className="field-input" style={{ marginTop: 8 }} type="password" placeholder="Password (optional)" value={form.proxy_pass}
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
  const pinfo = platformInfo(account.platform);
  const sinfo = systemInfo(account.account_system);
  const days = getDaysActive(account.warmup_start_date);
  const isIg = account.platform === 'instagram';

  return (
    <motion.div
      className="acc-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="acc-card__head">
        <div className="acc-card__icon" style={{ background: pinfo.color + '20', borderColor: pinfo.color + '40', color: pinfo.color }}>
          {pinfo.icon}
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
        <span className="acc-tag" style={{ color: pinfo.color, background: pinfo.color + '15', borderColor: pinfo.color + '30' }}>
          {pinfo.icon} {pinfo.label}
        </span>
        <span className="acc-tag acc-tag--sys">
          {sinfo.icon} {sinfo.label}
        </span>
        {account.proxy_host && (
          <span className="acc-tag acc-tag--proxy">
            <Globe size={10} /> {account.proxy_host}:{account.proxy_port}
          </span>
        )}
      </div>

      {/* Stats — Instagram only */}
      {isIg && (
        <div className="acc-card__stats">
          <div className="acc-stat">
            <div className="acc-stat__num" style={{ color: pinfo.color }}>Day {Math.min(days + 1, 40)}</div>
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
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
        <button className="btn btn-danger-ghost btn-sm" onClick={onDelete}><Trash2 size={12} /> Remove</button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ALL_TAB = 'all' as const;
type TabValue = typeof ALL_TAB | Platform;

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>(ALL_TAB);
  const [showAdd, setShowAdd] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | undefined>();

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

  const deleteAccount = async (id: string) => {
    if (!confirm('Remove this account? This cannot be undone.')) return;
    await supabase.from('accounts').delete().eq('id', id);
    fetchAccounts();
  };

  const filtered = tab === ALL_TAB ? accounts : accounts.filter(a => a.platform === tab);

  const counts = PLATFORMS.reduce((acc, p) => {
    acc[p.value] = accounts.filter(a => a.platform === p.value).length;
    return acc;
  }, {} as Record<Platform, number>);

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Accounts</div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditAccount(undefined); setShowAdd(true); }}>
          <Plus size={14} /> Add Account
        </button>
      </div>

      <div className="page-content">
        {/* Platform filter tabs */}
        <div className="acc-tabs">
          <div className="acc-tabs__filter">
            <Filter size={13} style={{ color: 'var(--text-3)' }} />
            <span className="acc-tabs__filter-label">Filter</span>
          </div>
          <button
            onClick={() => setTab(ALL_TAB)}
            className={`acc-tab ${tab === ALL_TAB ? 'acc-tab--active' : ''}`}
          >
            All ({accounts.length})
          </button>
          {PLATFORMS.map(p => (
            <button
              key={p.value}
              onClick={() => setTab(p.value)}
              className={`acc-tab ${tab === p.value ? 'acc-tab--active' : ''}`}
              style={{ '--tab-color': p.color } as React.CSSProperties}
            >
              {p.icon} {p.label} ({counts[p.value] ?? 0})
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="acc-loading">
            <div className="spinner" style={{ width: 26, height: 26 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><User size={22} /></div>
            <h3>No accounts {tab !== ALL_TAB ? `for ${platformInfo(tab as Platform).label}` : 'yet'}</h3>
            <p>
              {tab !== ALL_TAB
                ? `Add a ${platformInfo(tab as Platform).label} account to get started.`
                : 'Add your first AdsPower account to connect a platform.'}
            </p>
            <button className="btn btn-primary" onClick={() => { setEditAccount(undefined); setShowAdd(true); }}>
              <Plus size={14} /> Add account
            </button>
          </div>
        ) : (
          <div className="acc-grid">
            {filtered.map((a, i) => (
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
          width: 100%; max-width: 500px;
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

        /* ── Fields ── */
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field-label { font-size: 11.5px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
        .field-input { width: 100%; padding: 9px 12px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; color: var(--text-1); font-size: 13px; font-family: inherit; box-sizing: border-box; transition: border-color 0.15s; }
        .field-input:focus { outline: none; border-color: var(--cyan); }
        .field-input::placeholder { color: var(--text-4); }
        .field-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        /* ── Platform selector ── */
        .platform-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .platform-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 9px 4px; border-radius: 10px; border: 1.5px solid var(--border); background: transparent; color: var(--text-3); cursor: pointer; font-size: 10.5px; font-weight: 700; transition: all 0.15s; font-family: inherit; }
        .platform-btn:hover { border-color: var(--p-color, var(--border-2)); color: var(--p-color); }
        .platform-btn--active { border-color: var(--p-color); background: color-mix(in srgb, var(--p-color) 12%, transparent); color: var(--p-color); }

        /* ── System selector ── */
        .system-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .system-btn { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--border); background: transparent; cursor: pointer; text-align: left; transition: all 0.15s; font-family: inherit; }
        .system-btn:hover { border-color: var(--border-2); background: var(--surface-2); }
        .system-btn--active { border-color: var(--cyan); background: rgba(34,211,238,0.08); }
        .system-btn__icon { color: var(--text-3); flex-shrink: 0; }
        .system-btn--active .system-btn__icon { color: var(--cyan); }
        .system-btn__label { display: block; font-size: 12.5px; font-weight: 700; color: var(--text-1); }
        .system-btn__desc { display: block; font-size: 10.5px; color: var(--text-3); }

        /* ── Spinner ── */
        .spinner-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.2); border-top-color: black; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Account Card ── */
        .acc-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 13px; }
        .acc-card__head { display: flex; align-items: center; gap: 12px; }
        .acc-card__icon { width: 40px; height: 40px; border-radius: 11px; border: 1.5px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .acc-card__info { flex: 1; min-width: 0; }
        .acc-card__name { font-weight: 700; font-size: 14px; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .acc-card__adspower { font-size: 11px; color: var(--text-3); font-family: monospace; }

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
        .acc-tag--sys { color: var(--cyan); background: rgba(34,211,238,0.08); border-color: rgba(34,211,238,0.2); }
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
        .acc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
        .acc-loading { display: flex; justify-content: center; padding: 80px; }

        .btn-sm { padding: 6px 12px !important; font-size: 12px !important; }
        .btn-danger-ghost { background: rgba(239,68,68,0.08); color: #f87171; border: 1px solid rgba(239,68,68,0.2); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: all 0.15s; font-family: inherit; flex: 1; justify-content: center; }
        .btn-danger-ghost:hover { background: rgba(239,68,68,0.15); }
      `}</style>
    </div>
  );
}

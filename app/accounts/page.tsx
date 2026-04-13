'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Trash2, User, Instagram, Music, Linkedin, Twitter,
  CheckCircle, AlertCircle, Globe, Zap, Filter
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Platform = 'instagram' | 'tiktok' | 'linkedin' | 'x';

interface Account {
  id: string;
  name: string;
  adspower_id: string;
  platform: Platform;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_user: string | null;
  status: 'active' | 'paused' | 'error';
  warmup_start_date: string | null;
  daily_limit: number;
  created_at: string;
}

const PLATFORMS: { value: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'instagram', label: 'Instagram',  icon: <Instagram size={14} />,  color: '#e1306c' },
  { value: 'tiktok',    label: 'TikTok',      icon: <Music size={14} />,     color: '#ff0050' },
  { value: 'linkedin',  label: 'LinkedIn',    icon: <Linkedin size={14} />, color: '#0a66c2' },
  { value: 'x',         label: 'X',           icon: <Twitter size={14} />,  color: '#1da1f2' },
];

const STATUS_OPTIONS = ['active', 'paused', 'error'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function platformInfo(p: Platform) {
  return PLATFORMS.find(x => x.value === p) ?? PLATFORMS[0];
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal"
        style={{ maxWidth: 480 }}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-hd">
          <h3>{existing ? 'Edit Account' : 'Add Account'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>

        {error && <div className="auth-err" style={{ marginBottom: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Platform selector */}
          <div className="field">
            <label>Platform</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, platform: p.value }))}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: `1.5px solid ${form.platform === p.value ? p.color : 'var(--border)'}`,
                    background: form.platform === p.value ? p.color + '18' : 'transparent',
                    color: form.platform === p.value ? p.color : 'var(--text-2)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Display name</label>
            <input
              className="field-input"
              placeholder="e.g. Fitness Outreach"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="field">
            <label>AdsPower Profile ID</label>
            <input
              className="field-input"
              placeholder="e.g. k19selk6"
              value={form.adspower_id}
              onChange={e => setForm(f => ({ ...f, adspower_id: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            <div className="field">
              <label>Proxy host</label>
              <input className="field-input" placeholder="207.135.197.155" value={form.proxy_host}
                onChange={e => setForm(f => ({ ...f, proxy_host: e.target.value }))} />
            </div>
            <div className="field">
              <label>Proxy port</label>
              <input className="field-input" placeholder="6096" value={form.proxy_port}
                onChange={e => setForm(f => ({ ...f, proxy_port: e.target.value }))} />
            </div>
          </div>

          <div className="field">
            <label>Proxy username</label>
            <input className="field-input" placeholder="Optional" value={form.proxy_user}
              onChange={e => setForm(f => ({ ...f, proxy_user: e.target.value }))} />
          </div>

          <div className="field">
            <label>Proxy password</label>
            <input className="field-input" type="password" placeholder="Optional" value={form.proxy_pass}
              onChange={e => setForm(f => ({ ...f, proxy_pass: e.target.value }))} />
          </div>

          <div className="modal-foot" style={{ marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : <><Plus size={14} /> {existing ? 'Save Changes' : 'Add Account'}</>}
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
  const days = getDaysActive(account.warmup_start_date);
  const isIg = account.platform === 'instagram';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: pinfo.color + '20',
            border: `1.5px solid ${pinfo.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: pinfo.color,
          }}>
            {pinfo.icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{account.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'monospace' }}>{account.adspower_id}</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 99,
          background: account.status === 'active' ? '#10b98120' : account.status === 'paused' ? '#f5910f20' : '#ef444420',
          border: `1px solid ${account.status === 'active' ? '#10b98140' : account.status === 'paused' ? '#f5910f40' : '#ef444440'}`,
          fontSize: 11, fontWeight: 600,
          color: account.status === 'active' ? '#10b981' : account.status === 'paused' ? '#f5910f' : '#ef4444',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: account.status === 'active' ? '#10b981' : account.status === 'paused' ? '#f5910f' : '#ef4444',
          }} />
          {account.status}
        </div>
      </div>

      {/* Platform badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 99,
          background: pinfo.color + '15', border: `1px solid ${pinfo.color}30`,
          fontSize: 11.5, fontWeight: 600, color: pinfo.color,
        }}>
          {pinfo.icon} {pinfo.label}
        </div>
        {account.proxy_host && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)' }}>
            <Globe size={10} /> {account.proxy_host}:{account.proxy_port}
          </div>
        )}
      </div>

      {/* Stats — Instagram only */}
      {isIg && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 8, padding: '10px 12px',
          background: 'var(--bg)', borderRadius: 8,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: pinfo.color }}>
              Day {Math.min(days + 1, 40)}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Warmup</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa' }}>
              {account.daily_limit}/day
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Limit</div>
          </div>
        </div>
      )}

      {/* Meta */}
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
        Added {formatDate(account.created_at)}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ flex: 1, fontSize: 12 }}
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          className="btn btn-danger btn-sm"
          style={{ flex: 1, fontSize: 12 }}
          onClick={onDelete}
        >
          <Trash2 size={12} /> Remove
        </button>
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
    setAccounts(data || []);
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
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-title">Accounts</div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditAccount(undefined); setShowAdd(true); }}>
          <Plus size={14} /> Add Account
        </button>
      </div>

      <div className="page-content">
        {/* Platform filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 4 }}>
            <Filter size={13} style={{ color: 'var(--text-3)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter</span>
          </div>
          <button
            onClick={() => setTab(ALL_TAB)}
            style={{
              padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${tab === ALL_TAB ? 'var(--text-2)' : 'var(--border)'}`,
              background: tab === ALL_TAB ? 'var(--text-2)' : 'transparent',
              color: tab === ALL_TAB ? 'var(--bg)' : 'var(--text-2)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            All ({accounts.length})
          </button>
          {PLATFORMS.map(p => (
            <button
              key={p.value}
              onClick={() => setTab(p.value)}
              style={{
                padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${tab === p.value ? p.color : 'var(--border)'}`,
                background: tab === p.value ? p.color + '18' : 'transparent',
                color: tab === p.value ? p.color : 'var(--text-2)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
            >
              {p.icon} {p.label} ({counts[p.value] ?? 0})
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
          }}>
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
    </div>
  );
}

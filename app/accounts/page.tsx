'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IGAccount } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Loader2, RefreshCw } from 'lucide-react';


const WARMUP_SCHEDULE = [5, 8, 12, 16, 20, 25, 30, 40];

function getWarmupInfo(account: IGAccount) {
  if (!account.warmup_start_date) return { day: 0, limit: 5, label: 'Day 1' };
  const days = Math.floor((Date.now() - new Date(account.warmup_start_date).getTime()) / 86400000);
  const limit = WARMUP_SCHEDULE[Math.min(days, WARMUP_SCHEDULE.length - 1)] || 40;
  return { day: days + 1, limit, label: `Day ${days + 1}` };
}

function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    name: '',
    adspower_id: '',
    proxy_host: '',
    proxy_port: '',
    proxy_user: '',
    proxy_pass: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('accounts').insert({
        user_id: user.id,
        name: form.name,
        adspower_id: form.adspower_id,
        proxy_host: form.proxy_host || null,
        proxy_port: form.proxy_port ? parseInt(form.proxy_port) : null,
        proxy_user: form.proxy_user || null,
        proxy_pass: form.proxy_pass || null,
        warmup_start_date: new Date().toISOString(),
        daily_limit: 5,
        status: 'active',
      });
      if (error) throw error;
      onAdded();
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>Add Account</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm"><X size={18} /></button>
        </div>
        {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Display name</label>
            <input className="input" placeholder="Fitness Outreach" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="input-group">
            <label>AdsPower Profile ID</label>
            <input className="input" placeholder="k19selk6" value={form.adspower_id} onChange={e => setForm(f => ({ ...f, adspower_id: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label>Proxy host</label>
              <input className="input" placeholder="207.135.197.155" value={form.proxy_host} onChange={e => setForm(f => ({ ...f, proxy_host: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Proxy port</label>
              <input className="input" placeholder="6096" value={form.proxy_port} onChange={e => setForm(f => ({ ...f, proxy_port: e.target.value }))} />
            </div>
          </div>
          <div className="input-group">
            <label>Proxy username (optional)</label>
            <input className="input" placeholder="pgtibrkq" value={form.proxy_user} onChange={e => setForm(f => ({ ...f, proxy_user: e.target.value }))} />
          </div>
          <div className="input-group">
            <label>Proxy password (optional)</label>
            <input className="input" type="password" placeholder="••••••" value={form.proxy_pass} onChange={e => setForm(f => ({ ...f, proxy_pass: e.target.value }))} />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : <><Plus size={16} /> Add Account</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<IGAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAccounts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const deleteAccount = async (id: string) => {
    if (!confirm('Remove this account?')) return;
    await supabase.from('accounts').delete().eq('id', id);
    fetchAccounts();
  };

  return (
    <div>
      <div className="topbar">
        <h2>Accounts</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : accounts.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
            <h3>No accounts connected</h3>
            <p>Add your first Instagram AdsPower account to start outreach.</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add account
            </button>
          </div>
        ) : (
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {accounts.map((a, i) => {
              const wi = getWarmupInfo(a);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{a.name}</h4>
                        <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{a.adspower_id}</div>
                      </div>
                      <span className={`badge ${a.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                        {a.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 800 }}>{wi.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Warmup</div>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 800 }}>{wi.limit}/day</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Current Limit</div>
                      </div>
                    </div>

                    {a.proxy_host && (
                      <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' }}>
                        Proxy: {a.proxy_host}:{a.proxy_port}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => deleteAccount(a.id)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={fetchAccounts} />}
      </AnimatePresence>
    </div>
  );
}

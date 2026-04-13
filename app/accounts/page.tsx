'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IGAccount } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, User } from 'lucide-react';

const WARMUP_SCHEDULE = [5, 8, 12, 16, 20, 25, 30, 40];

function getWarmupInfo(a: IGAccount) {
  if (!a.warmup_start_date) return { day: 1, limit: 5 };
  const days = Math.floor((Date.now() - new Date(a.warmup_start_date).getTime()) / 86400000);
  const limit = WARMUP_SCHEDULE[Math.min(days, WARMUP_SCHEDULE.length - 1)] || 40;
  return { day: Math.min(days + 1, 40), limit };
}

function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', adspower_id: '', proxy_host: '', proxy_port: '', proxy_user: '', proxy_pass: '' });
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
      const { error } = await supabase.from('accounts').insert({
        user_id: user.id, name: form.name, adspower_id: form.adspower_id,
        proxy_host: form.proxy_host || null,
        proxy_port: form.proxy_port ? parseInt(form.proxy_port) : null,
        proxy_user: form.proxy_user || null, proxy_pass: form.proxy_pass || null,
        warmup_start_date: new Date().toISOString(), daily_limit: 5, status: 'active',
      });
      if (error) throw error;
      onAdded(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd">
          <h3>Add Account</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '22px' }}>Connect an Instagram AdsPower profile to start outreach.</p>
        {error && <div className="auth-err" style={{ marginBottom: '14px' }}>{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field"><label>Display name</label><input className="field-input" placeholder="e.g. Fitness Outreach" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div className="field"><label>AdsPower Profile ID</label><input className="field-input" placeholder="k19selk6" value={form.adspower_id} onChange={e => setForm(f => ({ ...f, adspower_id: e.target.value }))} required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
            <div className="field"><label>Proxy host</label><input className="field-input" placeholder="207.135.197.155" value={form.proxy_host} onChange={e => setForm(f => ({ ...f, proxy_host: e.target.value }))} /></div>
            <div className="field"><label>Proxy port</label><input className="field-input" placeholder="6096" value={form.proxy_port} onChange={e => setForm(f => ({ ...f, proxy_port: e.target.value }))} /></div>
          </div>
          <div className="field"><label>Proxy username</label><input className="field-input" placeholder="Optional" value={form.proxy_user} onChange={e => setForm(f => ({ ...f, proxy_user: e.target.value }))} /></div>
          <div className="field"><label>Proxy password</label><input className="field-input" type="password" placeholder="Optional" value={form.proxy_pass} onChange={e => setForm(f => ({ ...f, proxy_pass: e.target.value }))} /></div>
          <div className="modal-foot">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <div className="spinner" /> : <><Plus size={14} /> Add Account</>}</button>
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
        <div className="topbar-title">Accounts</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Account</button>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><div className="spinner" style={{ width: 26, height: 26 }} /></div>
        ) : accounts.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><User size={22} /></div>
            <h3>No accounts connected</h3>
            <p>Add your first Instagram AdsPower account to start outreach.</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add account</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
            {accounts.map((a, i) => {
              const wi = getWarmupInfo(a);
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="acc-card">
                    <div className="acc-card-hd">
                      <div>
                        <div className="acc-name">{a.name}</div>
                        <div className="acc-meta">{a.adspower_id}</div>
                      </div>
                      <span className={`badge ${a.status === 'active' ? 'badge-g' : 'badge-n'}`}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.status === 'active' ? 'var(--green)' : 'var(--text-3)', display: 'inline-block' }} />
                        {a.status}
                      </span>
                    </div>
                    <div className="acc-stats">
                      <div className="acc-stat"><div className="acc-stat-val" style={{ color: 'var(--violet)' }}>Day {wi.day}</div><div className="acc-stat-lbl">Warmup</div></div>
                      <div className="acc-stat"><div className="acc-stat-val" style={{ color: 'var(--cyan)' }}>{wi.limit}/day</div><div className="acc-stat-lbl">Current Limit</div></div>
                    </div>
                    {a.proxy_host && <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginBottom: '14px', fontFamily: 'monospace' }}>{a.proxy_host}:{a.proxy_port}</div>}
                    <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => deleteAccount(a.id)}><Trash2 size={12} /> Remove</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>{showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={fetchAccounts} />}</AnimatePresence>
    </div>
  );
}

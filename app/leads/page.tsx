'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Lead } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, Users, Search } from 'lucide-react';

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [campaigns, setCampaigns] = useState<{id: string; name: string}[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [usernames, setUsernames] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from('campaigns').select('id, name').eq('user_id', data.user.id).then(({ data }) => {
        setCampaigns(data || []);
        if (data?.[0]) setCampaignId(data[0].id);
      });
    });
  }, []);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const names = usernames.split('\n').map(n => n.trim()).filter(Boolean);
      if (!user) return;
      // Verify campaign belongs to this user if campaignId provided
      if (campaignId) {
        const { data: camp } = await supabase.from('campaigns').select('id').eq('id', campaignId).eq('user_id', user.id).single();
        if (!camp) { setError('Campaign not found'); setLoading(false); return; }
      }
      const leads = names.map(name => ({ user_id: user.id, campaign_id: campaignId || null, username: name.replace('@', ''), status: 'pending' as const }));
      const { error } = await supabase.from('leads').insert(leads);
      if (error) throw error;
      onImported(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd">
          <h3>Import Leads</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '22px' }}>Paste Instagram usernames, one per line.</p>
        {error && <div className="auth-err" style={{ marginBottom: '14px' }}>{error}</div>}
        <form onSubmit={handleImport}>
          <div className="field" style={{ marginBottom: '14px' }}>
            <label>Campaign (optional)</label>
            <select className="field-input" value={campaignId} onChange={e => setCampaignId(e.target.value)}>
              <option value="">No campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: '16px' }}>
            <label>Usernames</label>
            <textarea style={{ minHeight: '180px', fontFamily: 'monospace', fontSize: '13px' }} placeholder="alex_smith&#10;sarah.jones&#10;david_fitness&#10;..." value={usernames} onChange={e => setUsernames(e.target.value)} required />
            <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>One username per line, no @ symbol needed.</span>
          </div>
          <div className="modal-foot">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <div className="spinner" /> : <><Upload size={14} /> Import</>}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Sent' },
  { key: 'replied', label: 'Replied' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'no_dm_access', label: 'No DM' },
];

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-n', sent: 'badge-g', replied: 'badge-v',
  escalated: 'badge-y', no_dm_access: 'badge-r',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', sent: 'Sent', replied: 'Replied',
  escalated: 'Escalated', no_dm_access: 'No DM',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLeads = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('leads').select('*, campaign:campaigns(name)').eq('user_id', user.id).order('created_at', { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = leads.filter(l => {
    const matchStatus = filter === 'all' || l.status === filter;
    const matchSearch = !search || l.username.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Leads</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowImport(true)}><Plus size={14} /> Import Leads</button>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><div className="spinner" style={{ width: 26, height: 26 }} /></div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '190px' }}>
                <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                <input className="field-input" placeholder="Search usernames..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '34px' }} />
              </div>
              <div className="tab-row">
                {FILTERS.map(f => (
                  <button key={f.key} className={`tab-btn ${filter === f.key ? 'on' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon"><Users size={22} /></div>
                <h3>{leads.length === 0 ? 'No leads yet' : 'No matches found'}</h3>
                <p>{leads.length === 0 ? 'Import leads or add them to a campaign to get started.' : 'Try a different search or filter.'}</p>
                {leads.length === 0 && <button className="btn btn-primary" onClick={() => setShowImport(true)}><Upload size={14} /> Import leads</button>}
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Username</th><th>Campaign</th><th>Status</th><th>Added</th></tr></thead>
                    <tbody>
                      {filtered.map(l => (
                        <tr key={l.id}>
                          <td style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace', fontSize: '13px' }}>@{l.username}</td>
                          <td style={{ fontSize: '13px' }}>{(l as any).campaign?.name || '—'}</td>
                          <td><span className={`badge ${STATUS_BADGE[l.status] || 'badge-n'}`}>{STATUS_LABEL[l.status] || l.status}</span></td>
                          <td style={{ color: 'var(--text-3)', fontSize: '12.5px' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '10px', fontSize: '12.5px', color: 'var(--text-3)' }}>
                  Showing {filtered.length} of {leads.length} leads
                </div>
              </>
            )}
          </>
        )}
      </div>

      <AnimatePresence>{showImport && <ImportModal onClose={() => setShowImport(false)} onImported={fetchLeads} />}</AnimatePresence>
    </div>
  );
}

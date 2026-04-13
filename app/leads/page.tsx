'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Lead, Campaign } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, Users as UsersIcon, Search } from 'lucide-react';

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} aria-label="Close" style={{
      width: '32px', height: '32px', borderRadius: '9px',
      background: 'var(--surface3)', border: '1px solid var(--border2)',
      color: 'var(--text2)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--surface4)'; (e.target as HTMLElement).style.color = 'var(--text)'; }}
      onMouseLeave={e => { (e.target as HTMLElement).style.background = 'var(--surface3)'; (e.target as HTMLElement).style.color = 'var(--text2)'; }}
    ><X size={15} /></button>
  );
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [campaigns, setCampaigns] = useState<{id: string; name: string}[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [usernames, setUsernames] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('campaigns').select('id, name').eq('user_id', data.user.id).then(({ data }) => {
          setCampaigns(data || []);
          if (data?.[0]) setCampaignId(data[0].id);
        });
      }
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
      const leads = names.map(name => ({
        user_id: user.id,
        campaign_id: campaignId || null,
        username: name.replace('@', ''),
        status: 'pending' as const,
      }));
      const { error } = await supabase.from('leads').insert(leads);
      if (error) throw error;
      onImported();
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h3>Import Leads</h3>
          <CloseButton onClose={onClose} />
        </div>
        <p className="modal-subtitle">Paste Instagram usernames, one per line.</p>
        {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}
        <form onSubmit={handleImport}>
          <div className="input-group" style={{ marginBottom: '14px' }}>
            <label>Campaign (optional)</label>
            <select className="input" value={campaignId} onChange={e => setCampaignId(e.target.value)}>
              <option value="">No campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Usernames</label>
            <textarea
              style={{ minHeight: '180px', fontFamily: 'monospace', fontSize: '13px' }}
              placeholder="alex_smith&#10;sarah.jones&#10;david健身&#10;..."
              value={usernames}
              onChange={e => setUsernames(e.target.value)}
              required
            />
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
              Enter one username per line. Do not include @.
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : <><Upload size={14} /> Import</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<{id: string; name: string}[]>([]);
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('campaigns').select('id, name').eq('user_id', data.user.id).then(({ data }) => setCampaigns(data || []));
      }
    });
    fetchLeads();
  }, [fetchLeads]);

  const filtered = leads.filter(l => {
    const matchStatus = filter === 'all' || l.status === filter;
    const matchSearch = !search || l.username.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusColor = (s: string) => ({
    pending: 'badge-gray', sent: 'badge-green', replied: 'badge-purple',
    escalated: 'badge-yellow', no_dm_access: 'badge-red',
  }[s] || 'badge-gray');

  const statusLabel = (s: string) => ({
    pending: 'Pending', sent: 'Sent', replied: 'Replied',
    escalated: 'Escalated', no_dm_access: 'No DM',
  }[s] || s);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'sent', label: 'Sent' },
    { key: 'replied', label: 'Replied' },
    { key: 'escalated', label: 'Escalated' },
    { key: 'no_dm_access', label: 'No DM' },
  ];

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left"><h2>Leads</h2></div>
        <div className="topbar-right">
          <button className="btn btn-primary btn-sm" onClick={() => setShowImport(true)}>
            <Plus size={15} /> Import Leads
          </button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                <input className="input" placeholder="Search by username..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
              </div>
              <div className="tabs">
                {filters.map(f => (
                  <button key={f.key} className={`tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><UsersIcon size={24} /></div>
                <h3>{leads.length === 0 ? 'No leads yet' : 'No matches found'}</h3>
                <p>{leads.length === 0 ? 'Import leads from a CSV or add them manually to a campaign.' : 'Try a different search or filter.'}</p>
                {leads.length === 0 && (
                  <button className="btn btn-primary" onClick={() => setShowImport(true)}>
                    <Upload size={15} /> Import leads
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Campaign</th>
                        <th>Status</th>
                        <th>Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(l => (
                        <tr key={l.id}>
                          <td style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace', fontSize: '13px' }}>
                            @{l.username}
                          </td>
                          <td>{(l as any).campaign?.name || '—'}</td>
                          <td><span className={`badge ${statusColor(l.status)}`}>{statusLabel(l.status)}</span></td>
                          <td style={{ color: 'var(--text3)', fontSize: '13px' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text3)' }}>
                  Showing {filtered.length} of {leads.length} leads
                </div>
              </>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={fetchLeads} />}
      </AnimatePresence>
    </div>
  );
}

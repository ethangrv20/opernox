'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Lead, Campaign } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, Users as UsersIcon, Loader2, Search } from 'lucide-react';

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [campaigns, setCampaigns] = useState<{id: string; name: string}[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [usernames, setUsernames] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        campaign_id: campaignId,
        username: name.replace('@', ''),
        status: 'pending' as const,
      }));

      const { error } = await supabase.from('leads').insert(leads);
      if (error) throw error;
      onImported();
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
          <h3>Import Leads</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm"><X size={18} /></button>
        </div>
        {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}
        <form onSubmit={handleImport}>
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Campaign</label>
            <select className="input" value={campaignId} onChange={e => setCampaignId(e.target.value)} required>
              <option value="">Select campaign...</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Usernames (one per line)</label>
            <textarea
              style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '13px' }}
              placeholder={"alex_smith\nsarah.jones\ndavid健身\n..."}
              value={usernames}
              onChange={e => setUsernames(e.target.value)}
              required
            />
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
              Enter Instagram usernames, one per line. Do not include the @ symbol.
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : <><Upload size={16} /> Import</>}
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
    const { data } = await supabase
      .from('leads')
      .select('*, campaign:campaigns(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
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

  const statusColor = (s: string) => {
    if (s === 'sent') return 'badge-green';
    if (s === 'replied') return 'badge-purple';
    if (s === 'escalated') return 'badge-yellow';
    if (s === 'no_dm_access') return 'badge-red';
    return 'badge-gray';
  };

  const statusLabel = (s: string) => {
    if (s === 'no_dm_access') return 'No DM';
    return s;
  };

  return (
    <div>
      <div className="topbar">
        <h2>Leads</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowImport(true)}>
          <Plus size={16} /> Import Leads
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                <input
                  className="input"
                  placeholder="Search by username..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>
              <div className="tabs">
                {['all', 'pending', 'sent', 'replied', 'escalated', 'no_dm_access'].map(f => (
                  <button
                    key={f}
                    className={`tab ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all' ? 'All' : f === 'no_dm_access' ? 'No DM' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <UsersIcon />
                <h3>{leads.length === 0 ? 'No leads yet' : 'No matches found'}</h3>
                <p>{leads.length === 0 ? 'Import leads from a CSV or add them manually to a campaign.' : 'Try a different search or filter.'}</p>
                {leads.length === 0 && (
                  <button className="btn btn-primary" onClick={() => setShowImport(true)}>
                    <Upload size={16} /> Import leads
                  </button>
                )}
              </div>
            ) : (
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
                    {filtered.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>@{l.username}</td>
                        <td>{(l as any).campaign?.name || '—'}</td>
                        <td><span className={`badge ${statusColor(l.status)}`}>{statusLabel(l.status)}</span></td>
                        <td style={{ color: 'var(--text3)' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text3)' }}>
              Showing {filtered.length} of {leads.length} leads
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={fetchLeads} />}
      </AnimatePresence>
    </div>
  );
}

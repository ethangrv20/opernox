'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Campaign, IGAccount } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Pause, Trash2, X, Zap, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close"
      style={{
        width: '32px', height: '32px', borderRadius: '9px',
        background: 'var(--surface3)', border: '1px solid var(--border2)',
        color: 'var(--text2)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        (e.target as HTMLElement).style.background = 'var(--surface4)';
        (e.target as HTMLElement).style.color = 'var(--text)';
      }}
      onMouseLeave={e => {
        (e.target as HTMLElement).style.background = 'var(--surface3)';
        (e.target as HTMLElement).style.color = 'var(--text2)';
      }}
    >
      <X size={15} />
    </button>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    account_id: '',
    message_template: 'Hey {{name}}! I came across your profile and thought what you\'re doing is really cool. Would love to connect!',
    ai_persona: '',
    goal: 'Book a discovery call',
    escalation_keywords: 'call,meet,schedule,book',
    offer_summary: '',
  });
  const [accounts, setAccounts] = useState<IGAccount[]>([]);
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
        supabase.from('accounts').select('*').eq('user_id', data.user.id).then(({ data }) => {
          setAccounts(data || []);
          if (data?.[0]) setForm(f => ({ ...f, account_id: data[0].id }));
        });
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('campaigns').insert({
        user_id: user.id,
        name: form.name,
        account_id: form.account_id || null,
        message_template: form.message_template,
        ai_persona: form.ai_persona,
        goal: form.goal,
        escalation_keywords: form.escalation_keywords.split(',').map(k => k.trim()).filter(Boolean),
        offer_summary: form.offer_summary,
        active: true,
      });
      if (error) throw error;
      onCreated();
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
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h3>New Campaign</h3>
          <CloseButton onClose={onClose} />
        </div>
        <p className="modal-subtitle">Set up an outreach flow to automate your Instagram DMs.</p>

        {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Campaign name</label>
            <input className="input" placeholder="e.g. Fitness Niche — Cold Outreach" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          <div className="input-group">
            <label>IG Account</label>
            <select className="input" value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}>
              <option value="">Use any account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Message template</label>
            <textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} style={{ minHeight: '110px' }} required />
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Use {'{{name}}'} for the lead&apos;s name</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label>AI Persona</label>
              <input className="input" placeholder="Friendly, professional" value={form.ai_persona} onChange={e => setForm(f => ({ ...f, ai_persona: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Goal</label>
              <input className="input" placeholder="Book a call" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} />
            </div>
          </div>

          <div className="input-group">
            <label>Escalation keywords</label>
            <input className="input" placeholder="call, meet, schedule, book" value={form.escalation_keywords} onChange={e => setForm(f => ({ ...f, escalation_keywords: e.target.value }))} />
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Replies containing these flag for human review</div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : <><Plus size={14} /> Create Campaign</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function CampaignCard({ c, onToggle, onDelete, fetchCampaigns }: {
  c: Campaign; onToggle: () => void; onDelete: () => void; fetchCampaigns: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="campaign-card">
        <div className="campaign-card-header">
          <div>
            <h4>{c.name}</h4>
            <p>{c.goal || 'No goal set'}</p>
          </div>
          <span className={`badge ${c.active ? 'badge-green' : 'badge-gray'}`}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.active ? 'var(--success)' : 'var(--text3)', display: 'inline-block' }} />
            {c.active ? 'Active' : 'Paused'}
          </span>
        </div>

        <div className="campaign-stats">
          <div className="campaign-stat">
            <div className="campaign-stat-val">—</div>
            <div className="campaign-stat-label">Leads</div>
          </div>
          <div className="campaign-stat">
            <div className="campaign-stat-val">—</div>
            <div className="campaign-stat-label">Sent</div>
          </div>
          <div className="campaign-stat">
            <div className="campaign-stat-val">—</div>
            <div className="campaign-stat-label">Replies</div>
          </div>
        </div>

        <div className="campaign-actions">
          <button onClick={onToggle} className={`btn ${c.active ? 'btn-secondary' : 'btn-primary'} btn-sm`}>
            {c.active ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Run</>}
          </button>
          <Link href="/leads">
            <button className="btn btn-ghost btn-sm">
              <UsersIcon size={13} /> Leads
            </button>
          </Link>
          <button onClick={onDelete} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', color: 'var(--error)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('campaigns').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const toggleCampaign = async (c: Campaign) => {
    await supabase.from('campaigns').update({ active: !c.active }).eq('id', c.id);
    fetchCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign and all its leads?')) return;
    await supabase.from('campaigns').delete().eq('id', id);
    fetchCampaigns();
  };

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left"><h2>Campaigns</h2></div>
        <div className="topbar-right">
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Campaign
          </button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Zap size={24} /></div>
            <h3>No campaigns yet</h3>
            <p>Create your first campaign to start reaching your audience.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Create campaign
            </button>
          </div>
        ) : (
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {campaigns.map((c, i) => (
              <div key={c.id} style={{ transitionDelay: `${i * 0.05}s` }}>
                <CampaignCard c={c} onToggle={() => toggleCampaign(c)} onDelete={() => deleteCampaign(c.id)} fetchCampaigns={fetchCampaigns} />
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={fetchCampaigns} />}
      </AnimatePresence>
    </div>
  );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Campaign, IGAccount } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Pause, Trash2, X, Zap, Users } from 'lucide-react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/* Create Modal — designed so close is ALWAYS obvious and easy         */
/* ------------------------------------------------------------------ */
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    account_id: '',
    message_template: 'Hey {{name}}! I came across your profile and thought what you\'re doing is really cool. Would love to connect!',
    ai_persona: '',
    goal: 'Book a discovery call',
    escalation_keywords: 'call, meet, schedule, book',
    offer_summary: '',
  });
  const [accounts, setAccounts] = useState<IGAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Escape always closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from('accounts').select('*').eq('user_id', data.user.id).then(({ data }) => {
        setAccounts(data || []);
        if (data?.[0]) setForm(f => ({ ...f, account_id: data[0].id }));
      });
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
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create campaign"
      >
        {/* Header */}
        <div className="modal-hd">
          <h3>New Campaign</h3>
          {/* Big obvious close button */}
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={15} />
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '22px' }}>
          Set up an outreach flow to automate your Instagram DMs.
        </p>

        {error && <div className="auth-err" style={{ marginBottom: '14px' }}>{error}</div>}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Campaign name</label>
            <input className="field-input" placeholder="e.g. Fitness Niche — Cold Outreach" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          <div className="field">
            <label>IG Account</label>
            <select className="field-input" value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}>
              <option value="">Use any account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Message template</label>
            <textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} style={{ minHeight: '105px' }} required />
            <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>Use {'{{name}}'} for the lead&apos;s first name</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
            <div className="field">
              <label>AI Persona</label>
              <input className="field-input" placeholder="Friendly, professional" value={form.ai_persona} onChange={e => setForm(f => ({ ...f, ai_persona: e.target.value }))} />
            </div>
            <div className="field">
              <label>Goal</label>
              <input className="field-input" placeholder="Book a call" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} />
            </div>
          </div>

          <div className="field">
            <label>Escalation keywords</label>
            <input className="field-input" placeholder="call, meet, schedule, book" value={form.escalation_keywords} onChange={e => setForm(f => ({ ...f, escalation_keywords: e.target.value }))} />
            <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>Flag replies containing these for human review</span>
          </div>

          <div className="field">
            <label>Offer summary</label>
            <input className="field-input" placeholder="Brief description of what you're offering" value={form.offer_summary} onChange={e => setForm(f => ({ ...f, offer_summary: e.target.value }))} />
          </div>

          {/* Footer with BIG cancel button */}
          <div className="modal-foot" style={{ marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ padding: '9px 20px', fontSize: '14px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '9px 22px' }}>
              {loading ? <div className="spinner" /> : <><Plus size={14} /> Create Campaign</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Campaign Card                                                        */
/* ------------------------------------------------------------------ */
function CampaignCard({ c, onToggle, onDelete, fetchCampaigns }: {
  c: Campaign; onToggle: () => void; onDelete: () => void; fetchCampaigns: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="camp-card">
        <div className="camp-card-hd">
          <div>
            <h4>{c.name}</h4>
            <p>{c.goal || 'No goal set'}</p>
          </div>
          <span className={`badge ${c.active ? 'badge-g' : 'badge-n'}`}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.active ? 'var(--green)' : 'var(--text-3)', display: 'inline-block' }} />
            {c.active ? 'Active' : 'Paused'}
          </span>
        </div>

        <div className="camp-stats">
          <div className="camp-stat"><div className="camp-stat-val" style={{ color: 'var(--text)' }}>—</div><div className="camp-stat-lbl">Leads</div></div>
          <div className="camp-stat"><div className="camp-stat-val" style={{ color: 'var(--violet)' }}>—</div><div className="camp-stat-lbl">Sent</div></div>
          <div className="camp-stat"><div className="camp-stat-val" style={{ color: 'var(--cyan)' }}>—</div><div className="camp-stat-lbl">Replies</div></div>
        </div>

        <div className="camp-actions">
          <button onClick={onToggle} className={`btn ${c.active ? 'btn-secondary' : 'btn-primary'} btn-sm`}>
            {c.active ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Run</>}
          </button>
          <Link href="/leads">
            <button className="btn btn-ghost btn-sm"><Users size={12} /> Leads</button>
          </Link>
          <button onClick={onDelete} className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
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
        <div className="topbar-title">Campaigns</div>
        <div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Campaign
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner" style={{ width: 26, height: 26 }} />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Zap size={22} /></div>
            <h3>No campaigns yet</h3>
            <p>Create your first campaign to start reaching your audience automatically.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create campaign
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
            {campaigns.map((c, i) => (
              <div key={c.id} style={{ transitionDelay: `${i * 0.04}s` }}>
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

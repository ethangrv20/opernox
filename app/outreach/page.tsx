'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Users, TrendingUp, Plug, Plus, Play, Pause, Trash2, X, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { getMcUrl } from '@/lib/mc-url';

const ACCENT = '#ec4899';

interface Campaign {
  id: string;
  name: string;
  account_id: string;
  message_template: string;
  ai_persona: string;
  goal: string;
  escalation_keywords: string[];
  offer_summary: string;
  active: boolean;
  created: string;
  dms_sent?: number;
  leads_total?: number;
  leads_contacted?: number;
  replies_received?: number;
  // AI Setter full config
  tone?: string;
  typing_style?: string;
  slang_level?: string;
  humor_level?: string;
  phrases_to_use?: string;
  phrases_to_avoid?: string;
  reply_strategy?: string;
  follow_up_days?: string;
  max_follow_ups?: number;
}

interface IGAccount {
  id: string;
  username: string;
  name?: string;
  adspower_id: string;
  status: string;
  days_active?: number;
  current_daily_limit?: number;
}

interface Lead {
  id: string;
  username: string;
  campaign_id: string;
  status: 'pending' | 'sent' | 'replied' | 'escalated' | 'failed';
  source: string;
  added_at: string;
}

interface Reply {
  id: string;
  campaign_id: string;
  username: string;
  message: string;
  timestamp: string;
  escalated: boolean;
}

interface Stats {
  total_sent: number;
  sent_today: number;
  accounts: number;
}

interface SystemConfig {
  tone?: string;
  typing_style?: string;
  slang_level?: string;
  humor_level?: string;
  reply_strategy?: string;
  phrases_to_use?: string;
  phrases_to_avoid?: string;
  follow_up_days?: string;
  max_follow_ups?: number;
}

export default function OutreachPage() {
  const [tab, setTab] = useState<'campaigns' | 'leads' | 'analytics'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<IGAccount[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [stats, setStats] = useState<Stats>({ total_sent: 0, sent_today: 0, accounts: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddLeads, setShowAddLeads] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null);
  const [replyEngineRunning, setReplyEngineRunning] = useState(false);
  const [systemConfigOpen, setSystemConfigOpen] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({});
  const [systemConfigSaving, setSystemConfigSaving] = useState(false);
  const [mcUrl, setMcUrl] = useState('http://127.0.0.1:3337');

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    account_id: '',
    message_template: 'Hey {{name}}! I came across your profile and thought we could collaborate.',
    goal: 'Book a discovery call',
    offer_summary: '',
    ai_persona: '',
    escalation_keywords: '',
    tone: 'professional',
    typing_style: 'standard',
    slang_level: 'minimal',
    humor_level: 'light',
    phrases_to_use: '',
    phrases_to_avoid: '',
    reply_strategy: 'helpful',
    follow_up_days: '3',
    max_follow_ups: 3,
  });

  const [newLeadsText, setNewLeadsText] = useState('');
  const [newLeadsCampaign, setNewLeadsCampaign] = useState('');

  const showToast = (type: 'ok' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSystemConfig = useCallback(async () => {
    try {
      const res = await fetch(mcUrl + '/api/system-config?system=ig_outreach');
      const data = await res.json();
      if (data.config) {
        setSystemConfig({
          tone: data.config.tone || 'professional',
          typing_style: data.config.typing_style || 'standard',
          slang_level: data.config.slang_level || 'minimal',
          humor_level: data.config.humor_level || 'light',
          reply_strategy: data.config.reply_strategy || 'helpful',
          phrases_to_use: data.config.phrases_to_use || '',
          phrases_to_avoid: data.config.phrases_to_avoid || '',
          follow_up_days: String(data.config.follow_up_days || 3),
          max_follow_ups: data.config.max_follow_ups || 3,
        });
      }
    } catch { /* ignore */ }
  }, []);

  const saveSystemConfig = async () => {
    setSystemConfigSaving(true);
    try {
      const res = await fetch(mcUrl + '/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: 'ig_outreach', ...systemConfig }),
      });
      const d = await res.json();
      if (d.id || d.system) showToast('ok', 'System AI defaults saved');
      else showToast('error', 'Failed to save â€” table may not exist. Run setup first.');
    } catch { showToast('error', 'Could not reach MC server'); }
    setSystemConfigSaving(false);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, aRes, lRes, repRes, sRes] = await Promise.all([
        fetch(mcUrl + '/api/outreach/campaigns').then(r => r.json()),
        fetch(mcUrl + '/api/outreach/accounts').then(r => r.json()),
        fetch(mcUrl + '/api/outreach/leads').then(r => r.json()),
        fetch(mcUrl + '/api/outreach/replies').then(r => r.json()),
        fetch(mcUrl + '/api/outreach/stats').then(r => r.json()),
      ]);
      setCampaigns(cRes.campaigns || []);
      setAccounts(aRes.accounts || []);
      setLeads(lRes.leads || []);
      setReplies(repRes.replies || []);
      setStats(sRes || { total_sent: 0, sent_today: 0, accounts: 0 });
    } catch { /* MC not reachable */ }
    setLoading(false);
  }, []);

  useEffect(() => { getMcUrl().then(setMcUrl); }, []);

  useEffect(() => { loadAll(); loadSystemConfig(); }, [loadAll, loadSystemConfig]);

  const runCampaign = async (id: string) => {
    try {
      const res = await fetch(mcUrl + '/api/outreach/campaigns/' + id + '/run', { method: 'POST' });
      const d = await res.json();
      showToast(d.success ? 'ok' : 'error', d.success ? 'Campaign launched!' : (d.error || 'Failed'));
    } catch { showToast('error', 'Could not reach MC server'); }
  };

  const toggleCampaign = async (id: string) => {
    try {
      const res = await fetch(mcUrl + '/api/outreach/campaigns/' + id + '/toggle', { method: 'POST' });
      const d = await res.json();
      if (d.success) setCampaigns(cs => cs.map(c => c.id === id ? { ...c, active: !c.active } : c));
    } catch { showToast('error', 'Could not reach MC server'); }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      const res = await fetch(mcUrl + '/api/outreach/campaigns/' + id, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) setCampaigns(cs => cs.filter(c => c.id !== id));
    } catch { showToast('error', 'Could not reach MC server'); }
  };

  const createCampaign = async () => {
    if (!newCampaign.name.trim()) { showToast('error', 'Campaign name required'); return; }
    try {
      const res = await fetch(mcUrl + '/api/outreach/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });
      const d = await res.json();
      if (d.success) {
        setCampaigns(cs => [...cs, { ...d.campaign, dms_sent: 0, leads_total: 0, leads_contacted: 0, replies_received: 0 }]);
        setShowCreate(false);
        // Pre-fill from system config for next new campaign
        const defaults = { name: '', account_id: '', message_template: newCampaign.message_template, goal: 'Book a discovery call', offer_summary: '', ai_persona: '', escalation_keywords: '', ...systemConfig };
        setNewCampaign({ ...defaults, tone: systemConfig.tone || 'professional', typing_style: systemConfig.typing_style || 'standard', slang_level: systemConfig.slang_level || 'minimal', humor_level: systemConfig.humor_level || 'light', phrases_to_use: systemConfig.phrases_to_use || '', phrases_to_avoid: systemConfig.phrases_to_avoid || '', reply_strategy: systemConfig.reply_strategy || 'helpful', follow_up_days: systemConfig.follow_up_days || '3', max_follow_ups: systemConfig.max_follow_ups || 3 });
        showToast('ok', 'Campaign created');
      } else {
        showToast('error', d.error || 'Failed to create');
      }
    } catch { showToast('error', 'Could not reach MC server'); }
  };

  const addLeads = async () => {
    if (!newLeadsText.trim() || !newLeadsCampaign) { showToast('error', 'Select campaign and enter usernames'); return; }
    const usernames = newLeadsText.split('\n').map(u => u.trim()).filter(Boolean);
    if (usernames.length === 0) { showToast('error', 'No valid usernames'); return; }
    const firstAccount = accounts.find(a => a.id === newLeadsCampaign) || accounts[0];
    try {
      const res = await fetch(mcUrl + '/api/outreach/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: usernames.map(username => ({ username, campaign_id: newLeadsCampaign, source: 'manual' })),
          account_id: firstAccount?.id || '',
        }),
      });
      const d = await res.json();
      if (d.success) {
        showToast('ok', `Added ${d.added} lead${d.added !== 1 ? 's' : ''}`);
        setShowAddLeads(false);
        setNewLeadsText('');
        loadAll();
      } else {
        showToast('error', d.error || 'Failed to add');
      }
    } catch { showToast('error', 'Could not reach MC server'); }
  };

  const triggerReplyEngine = async () => {
    setReplyEngineRunning(true);
    try {
      const res = await fetch(mcUrl + '/api/outreach/reply-engine', { method: 'POST' });
      const d = await res.json();
      if (d.success) { showToast('ok', 'Reply engine triggered'); loadAll(); }
      else showToast('error', d.error || 'Failed');
    } catch { showToast('error', 'Could not reach MC server'); }
    setTimeout(() => setReplyEngineRunning(false), 3000);
  };

  const handleConnect = async () => {
    if (accounts.length === 0) { showToast('error', 'No IG accounts configured'); return; }
    try {
      const res = await fetch(mcUrl + '/api/ig/browser/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: accounts[0].adspower_id }),
      });
      const d = await res.json();
      if (d.success) showToast('ok', 'Browser opened for ' + accounts[0].username);
      else showToast('error', d.error || 'Failed to open browser');
    } catch { showToast('error', 'Could not reach MC server'); }
  };

  const connectedAccounts = accounts.filter(a => a.status === 'active' || a.status === 'connected');
  const totalReplies = replies.length;
  const escalatedCount = replies.filter(r => r.escalated).length;

  const statusBadge = (active: boolean) => (
    <span style={{
      padding: '2px 8px', borderRadius: 99, fontSize: '10px', fontWeight: 700,
      background: active ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
      color: active ? '#22c55e' : '#6b7280',
      border: '1px solid ' + (active ? 'rgba(34,197,94,0.25)' : 'rgba(107,114,128,0.25)'),
    }}>
      {active ? 'ACTIVE' : 'PAUSED'}
    </span>
  );

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">IG Outreach</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: connectedAccounts.length > 0 ? '#22c55e' : 'var(--text-3)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              {connectedAccounts.length > 0 ? connectedAccounts.length + ' connected' : 'Not connected'}
            </span>
          </div>
          <button onClick={handleConnect} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit' }}>
            <Plug size={12} /> Connect
          </button>
        </div>
      </div>

      <div className="page-content">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', top: 80, right: 20, zIndex: 9999,
                background: toast.type === 'ok' ? '#166534' : '#991b1b',
                color: 'white', padding: '10px 18px', borderRadius: 8,
                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}>
              {toast.type === 'ok' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Mass DM + AI Replies</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Automated Instagram outreach with intelligent response handling</div>
        </motion.div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { icon: <Send size={13} />, val: loading ? 'â€”' : stats.total_sent, label: 'DMs Sent', sub: 'All time' },
            { icon: <TrendingUp size={13} />, val: loading ? 'â€”' : stats.sent_today, label: 'Sent Today', sub: 'All accounts' },
            { icon: <MessageSquare size={13} />, val: loading ? 'â€”' : totalReplies, label: 'Replies', sub: 'Received' },
            { icon: <AlertCircle size={13} />, val: loading ? 'â€”' : escalatedCount, label: 'Escalated', sub: 'To human' },
            { icon: <Users size={13} />, val: loading ? 'â€”' : campaigns.filter(c => c.active).length, label: 'Active', sub: 'Campaigns' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <div style={{ color: ACCENT }}>{s.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>{s.val}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-4)', marginTop: 1 }}>{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* System AI Defaults â€” IG Outreach */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 14, overflow: 'hidden' }}>
          <div onClick={() => setSystemConfigOpen(!systemConfigOpen)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(124,58,237,0.05)', borderBottom: systemConfigOpen ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.6px' }}>System AI Defaults â€” IG Outreach</span>
              {systemConfig.tone && <span style={{ fontSize: '10px', color: 'var(--text-4)', fontWeight: 400 }}>({systemConfig.tone} Â· {systemConfig.reply_strategy})</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!systemConfigOpen && (
                <button onClick={(e) => { e.stopPropagation(); saveSystemConfig(); }} disabled={systemConfigSaving} style={{ padding: '3px 10px', borderRadius: 'var(--radius-sm)', background: '#8b5cf6', border: 'none', cursor: systemConfigSaving ? 'default' : 'pointer', fontSize: '10px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
                  {systemConfigSaving ? 'Saving...' : 'Save'}
                </button>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" style={{ transform: systemConfigOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
          {systemConfigOpen && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Tone / Typing Style / Slang */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Tone</div>
                  <select value={systemConfig.tone || 'professional'} onChange={e => setSystemConfig(s => ({ ...s, tone: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit' }}>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="assertive">Assertive</option>
                    <option value="aggressive">Aggressive</option>
                    <option value="playful">Playful</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Typing Style</div>
                  <select value={systemConfig.typing_style || 'standard'} onChange={e => setSystemConfig(s => ({ ...s, typing_style: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit' }}>
                    <option value="standard">Standard</option>
                    <option value="gen_z">Gen Z â€” lol, brb, etc</option>
                    <option value="all_lowercase">All lowercase</option>
                    <option value="formal">Formal â€” proper punctuation</option>
                    <option value="voice_notes">Voice note vibes</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Slang Level</div>
                  <select value={systemConfig.slang_level || 'minimal'} onChange={e => setSystemConfig(s => ({ ...s, slang_level: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit' }}>
                    <option value="none">No slang</option>
                    <option value="minimal">Minimal</option>
                    <option value="moderate">Moderate</option>
                    <option value="heavy">Heavy slang</option>
                  </select>
                </div>
              </div>
              {/* Humor / Reply Strategy */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Humor Level</div>
                  <select value={systemConfig.humor_level || 'light'} onChange={e => setSystemConfig(s => ({ ...s, humor_level: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit' }}>
                    <option value="none">No humor</option>
                    <option value="light">Light â€” occasional jokes</option>
                    <option value="moderate">Moderate â€” jokes welcome</option>
                    <option value="heavy">Heavy â€” joke around freely</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Reply Strategy</div>
                  <select value={systemConfig.reply_strategy || 'helpful'} onChange={e => setSystemConfig(s => ({ ...s, reply_strategy: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit' }}>
                    <option value="helpful">Helpful â€” answer questions first</option>
                    <option value="direct">Direct â€” pitch early</option>
                    <option value="storytelling">Storytelling â€” build curiosity</option>
                    <option value="question_based">Question-based â€” ask to qualify</option>
                  </select>
                </div>
              </div>
              {/* Phrases to Use */}
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Phrases to USE <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(comma-separated)</span></div>
                <input value={systemConfig.phrases_to_use || ''} onChange={e => setSystemConfig(s => ({ ...s, phrases_to_use: e.target.value }))} placeholder="e.g. game-changer, real talk, let me show you" style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              {/* Phrases to Avoid */}
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Phrases to AVOID <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(comma-separated)</span></div>
                <input value={systemConfig.phrases_to_avoid || ''} onChange={e => setSystemConfig(s => ({ ...s, phrases_to_avoid: e.target.value }))} placeholder="e.g. ayo, idk, tbh, sounds spammy" style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              {/* Follow-up Schedule */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Follow-up After (days)</div>
                  <input type="number" min="1" max="14" value={systemConfig.follow_up_days || '3'} onChange={e => setSystemConfig(s => ({ ...s, follow_up_days: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Max Follow-ups</div>
                  <input type="number" min="1" max="5" value={systemConfig.max_follow_ups || 3} onChange={e => setSystemConfig(s => ({ ...s, max_follow_ups: parseInt(e.target.value) || 3 }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>
              <button onClick={saveSystemConfig} disabled={systemConfigSaving} style={{ padding: '8px', background: '#8b5cf6', border: 'none', borderRadius: 6, color: 'white', fontSize: '12px', fontWeight: 700, cursor: systemConfigSaving ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                {systemConfigSaving ? 'Saving...' : 'Save System AI Defaults'}
              </button>
            </div>
          )}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '0 4px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex' }}>
                  {(['campaigns', 'leads', 'analytics'] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} style={{
                      padding: '12px 18px', fontSize: '12px', fontWeight: 600,
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      color: tab === t ? 'var(--text)' : 'var(--text-3)',
                      background: 'transparent', borderBottom: '2px solid ' + (tab === t ? ACCENT : 'transparent'), transition: 'all 0.15s',
                    }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                {tab === 'campaigns' && (
                  <button onClick={() => { setNewCampaign(c => ({ name: '', account_id: '', message_template: c.message_template, goal: 'Book a discovery call', offer_summary: '', ai_persona: '', escalation_keywords: '', tone: systemConfig.tone || 'professional', typing_style: systemConfig.typing_style || 'standard', slang_level: systemConfig.slang_level || 'minimal', humor_level: systemConfig.humor_level || 'light', reply_strategy: systemConfig.reply_strategy || 'helpful', phrases_to_use: systemConfig.phrases_to_use || '', phrases_to_avoid: systemConfig.phrases_to_avoid || '', follow_up_days: systemConfig.follow_up_days || '3', max_follow_ups: systemConfig.max_follow_ups || 3 })); setShowCreate(true); }} style={{ marginRight: 8, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
                    <Plus size={12} /> New Campaign
                  </button>
                )}
                {tab === 'leads' && (
                  <button onClick={() => setShowAddLeads(true)} style={{ marginRight: 8, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
                    <Plus size={12} /> Add Leads
                  </button>
                )}
              </div>

              {tab === 'campaigns' && (
                <div style={{ padding: '16px' }}>
                  {loading && campaigns.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)', fontSize: '13px' }}>Loading...</div>
                  ) : campaigns.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>No campaigns yet</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: 16 }}>Create your first campaign to start outreach</div>
                      <button onClick={() => { setNewCampaign(c => ({ name: '', account_id: '', message_template: c.message_template, goal: 'Book a discovery call', offer_summary: '', ai_persona: '', escalation_keywords: '', tone: systemConfig.tone || 'professional', typing_style: systemConfig.typing_style || 'standard', slang_level: systemConfig.slang_level || 'minimal', humor_level: systemConfig.humor_level || 'light', reply_strategy: systemConfig.reply_strategy || 'helpful', phrases_to_use: systemConfig.phrases_to_use || '', phrases_to_avoid: systemConfig.phrases_to_avoid || '', follow_up_days: systemConfig.follow_up_days || '3', max_follow_ups: systemConfig.max_follow_ups || 3 })); setShowCreate(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
                        <Plus size={13} /> Create Campaign
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {campaigns.map(c => (
                        <div key={c.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 2 }}>{c.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Goal: {c.goal}</div>
                            </div>
                            {statusBadge(c.active)}
                          </div>
                          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                            {[{ label: 'DMs Sent', val: c.dms_sent ?? 0 }, { label: 'Leads', val: c.leads_total ?? 0 }, { label: 'Replied', val: c.replies_received ?? 0 }].map(s => (
                              <div key={s.label}>
                                <div style={{ fontSize: '14px', fontWeight: 800 }}>{s.val}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-4)' }}>{s.label}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => runCampaign(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#22c55e', fontFamily: 'inherit' }}>
                              <Play size={11} /> Run
                            </button>
                            <button onClick={() => toggleCampaign(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-3)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit' }}>
                              <Pause size={11} /> {c.active ? 'Pause' : 'Resume'}
                            </button>
                            <button onClick={() => deleteCampaign(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#ef4444', fontFamily: 'inherit' }}>
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'leads' && (
                <div style={{ padding: '16px' }}>
                  {loading && leads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)', fontSize: '13px' }}>Loading...</div>
                  ) : leads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>No leads yet</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Add leads to your campaigns to start outreach</div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Username', 'Campaign', 'Status', 'Source', 'Added'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700, color: 'var(--text-3)', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {leads.slice(0, 50).map(l => {
                            const camp = campaigns.find(c => c.id === l.campaign_id);
                            const statusColors: Record<string, string> = { pending: '#f59e0b', sent: '#3b82f6', replied: '#22c55e', escalated: '#ef4444', failed: '#6b7280' };
                            return (
                              <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '8px 8px', fontWeight: 600 }}>@{l.username}</td>
                                <td style={{ padding: '8px 8px', color: 'var(--text-3)' }}>{camp?.name || l.campaign_id}</td>
                                <td style={{ padding: '8px 8px' }}>
                                  <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: '10px', fontWeight: 700, background: statusColors[l.status] ? statusColors[l.status] + '18' : 'var(--surface-3)', color: statusColors[l.status] || 'var(--text-3)', border: '1px solid ' + (statusColors[l.status] || 'var(--border)') + '30' }}>
                                    {l.status.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 8px', color: 'var(--text-4)' }}>{l.source}</td>
                                <td style={{ padding: '8px 8px', color: 'var(--text-4)' }}>{new Date(l.added_at).toLocaleDateString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {leads.length > 50 && <div style={{ textAlign: 'center', padding: '10px', fontSize: '11px', color: 'var(--text-4)' }}>Showing 50 of {leads.length} leads</div>}
                    </div>
                  )}
                </div>
              )}

              {tab === 'analytics' && (
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Recent Replies</div>
                  {replies.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)', fontSize: '13px' }}>No replies yet</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {replies.slice(0, 20).map(r => {
                        const camp = campaigns.find(c => c.id === r.campaign_id);
                        return (
                          <div key={r.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: '12px', fontWeight: 700 }}>@{r.username}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-4)' }}>{new Date(r.timestamp).toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: 4 }}>"{r.message}"</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-4)' }}>{camp?.name || r.campaign_id}</span>
                              {r.escalated && <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: '9px', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>ESCALATED</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* AI Reply Engine */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>AI Reply Engine</div>
                <button onClick={triggerReplyEngine} disabled={replyEngineRunning} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: replyEngineRunning ? 'var(--surface-3)' : ACCENT, border: 'none', cursor: replyEngineRunning ? 'default' : 'pointer', fontSize: '10px', fontWeight: 700, color: replyEngineRunning ? 'var(--text-3)' : 'white', fontFamily: 'inherit' }}>
                  <Zap size={10} /> {replyEngineRunning ? 'Running...' : 'Trigger'}
                </button>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>Auto-reply to DMs</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>AI responds to incoming DMs</div>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 99, background: ACCENT, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'white' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>Escalate on intent</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Flag hot leads for human</div>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 99, background: 'var(--surface-3)', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'var(--text-3)' }} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* DM Templates */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>DM Templates</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {campaigns.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', textAlign: 'center', padding: '8px 0' }}>No templates yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {campaigns.slice(0, 3).map(c => (
                      <div key={c.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: 3 }}>{c.name}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-4)', lineHeight: 1.5 }}>{c.message_template.substring(0, 60)}...</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* IG Accounts */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>IG Accounts</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {accounts.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', textAlign: 'center', padding: '8px 0' }}>No accounts yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {accounts.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>@{a.username}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-4)' }}>{a.days_active ?? 0}d active &middot; limit {a.current_daily_limit ?? 5}/day</div>
                        </div>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: (a.status === 'active' || a.status === 'connected') ? '#22c55e' : 'var(--text-3)' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Create Campaign Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>New Campaign</div>
                  <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>Campaign Name</div>
                    <input value={newCampaign.name} onChange={e => setNewCampaign(c => ({ ...c, name: e.target.value }))} placeholder="e.g. Real Estate Agents - Q2" style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>IG Account</div>
                    <select value={newCampaign.account_id} onChange={e => setNewCampaign(c => ({ ...c, account_id: e.target.value }))} style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit' }}>
                      <option value="">Select account...</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>@{a.username}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>Message Template</div>
                    <textarea value={newCampaign.message_template} onChange={e => setNewCampaign(c => ({ ...c, message_template: e.target.value }))} rows={4} style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                    <div style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: 3 }}>Use {'{{name}}'} for personalization</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>Goal</div>
                    <input value={newCampaign.goal} onChange={e => setNewCampaign(c => ({ ...c, goal: e.target.value }))} placeholder="e.g. Book a discovery call" style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>Offer Summary</div>
                    <textarea value={newCampaign.offer_summary} onChange={e => setNewCampaign(c => ({ ...c, offer_summary: e.target.value }))} rows={2} placeholder="Brief description of what you are offering..." style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>AI Persona <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(how the AI talks)</span></div>
                    <textarea value={newCampaign.ai_persona} onChange={e => setNewCampaign(c => ({ ...c, ai_persona: e.target.value }))} rows={3} placeholder="e.g. Friendly, professional, never pushy. Talks like a trusted advisor. Asks questions before pitching anything." style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>Escalation Keywords <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(comma-separated)</span></div>
                    <input value={newCampaign.escalation_keywords} onChange={e => setNewCampaign(c => ({ ...c, escalation_keywords: e.target.value }))} placeholder="e.g. interested, let's talk, book, schedule, yes" style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <div style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: 3 }}>If any of these words appear in a reply, it is flagged for human review</div>
                  </div>

                  {/* â”€â”€ AI SETTER CONFIG â”€â”€ */}
                  <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      </div>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.6px' }}>AI Setter Config</span>
                    </div>

                    {/* Tone / Typing Style / Slang */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Tone</div>
                        <select value={newCampaign.tone} onChange={e => setNewCampaign(c => ({ ...c, tone: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit' }}>
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="friendly">Friendly</option>
                          <option value="assertive">Assertive</option>
                          <option value="aggressive">Aggressive</option>
                          <option value="playful">Playful</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Typing Style</div>
                        <select value={newCampaign.typing_style} onChange={e => setNewCampaign(c => ({ ...c, typing_style: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit' }}>
                          <option value="standard">Standard</option>
                          <option value="gen_z">Gen Z â€” lol, brb, etc</option>
                          <option value="all_lowercase">All lowercase</option>
                          <option value="formal">Formal â€” proper punctuation</option>
                          <option value="voice_notes">Voice note vibes</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Slang Level</div>
                        <select value={newCampaign.slang_level} onChange={e => setNewCampaign(c => ({ ...c, slang_level: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit' }}>
                          <option value="none">No slang</option>
                          <option value="minimal">Minimal</option>
                          <option value="moderate">Moderate</option>
                          <option value="heavy">Heavy slang</option>
                        </select>
                      </div>
                    </div>

                    {/* Humor / Reply Strategy */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Humor Level</div>
                        <select value={newCampaign.humor_level} onChange={e => setNewCampaign(c => ({ ...c, humor_level: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit' }}>
                          <option value="none">No humor</option>
                          <option value="light">Light â€” occasional jokes</option>
                          <option value="moderate">Moderate â€” jokes welcome</option>
                          <option value="heavy">Heavy â€” joke around freely</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Reply Strategy</div>
                        <select value={newCampaign.reply_strategy} onChange={e => setNewCampaign(c => ({ ...c, reply_strategy: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit' }}>
                          <option value="helpful">Helpful â€” answer questions first</option>
                          <option value="direct">Direct â€” pitch early</option>
                          <option value="storytelling">Storytelling â€” build curiosity</option>
                          <option value="question_based">Question-based â€” ask to qualify</option>
                        </select>
                      </div>
                    </div>

                    {/* Phrases to Use */}
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Phrases to USE <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(comma-separated)</span></div>
                      <input value={newCampaign.phrases_to_use} onChange={e => setNewCampaign(c => ({ ...c, phrases_to_use: e.target.value }))} placeholder="e.g. game-changer, real talk, let me show you" style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>

                    {/* Phrases to Avoid */}
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Phrases to AVOID <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(comma-separated)</span></div>
                      <input value={newCampaign.phrases_to_avoid} onChange={e => setNewCampaign(c => ({ ...c, phrases_to_avoid: e.target.value }))} placeholder="e.g.ayo, idk, tbh, sounds spammy" style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>

                    {/* Follow-up Schedule */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Follow-up After (days)</div>
                        <input type="number" min="1" max="14" value={newCampaign.follow_up_days} onChange={e => setNewCampaign(c => ({ ...c, follow_up_days: e.target.value }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Max Follow-ups</div>
                        <input type="number" min="1" max="5" value={newCampaign.max_follow_ups} onChange={e => setNewCampaign(c => ({ ...c, max_follow_ups: parseInt(e.target.value) || 3 }))} style={{ width: '100%', padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  </div>

                  <button onClick={createCampaign} style={{ padding: '10px', background: ACCENT, border: 'none', borderRadius: 6, color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Create Campaign
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Leads Modal */}
        <AnimatePresence>
          {showAddLeads && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowAddLeads(false); }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>Add Leads</div>
                  <button onClick={() => setShowAddLeads(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>Campaign</div>
                    <select value={newLeadsCampaign} onChange={e => setNewLeadsCampaign(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit' }}>
                      <option value="">Select campaign...</option>
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 5 }}>Usernames (one per line)</div>
                    <textarea value={newLeadsText} onChange={e => setNewLeadsText(e.target.value)} rows={8} placeholder="chefmike_restaurant&#10;realtor_sarah_la&#10;homebuilder_dave_tx" style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={addLeads} style={{ padding: '10px', background: ACCENT, border: 'none', borderRadius: 6, color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Add {newLeadsText.split('\n').filter(l => l.trim()).length} Leads
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Users, TrendingUp, Clock, CheckCircle2, XCircle, Play, Pause, Plus, BarChart2 } from 'lucide-react';

const ACCENT = '#ec4899';

const MOCK_CAMPAIGNS = [
  { id: 1, name: 'Q2 Outreach — SaaS Founders', status: 'active', sent: 847, replied: 62, escalated: 8, last: '2 min ago' },
  { id: 2, name: 'Warm Lead Nurture', status: 'paused', sent: 312, replied: 28, escalated: 3, last: '1 hour ago' },
  { id: 3, name: 'Cold Outreach — Tech', status: 'active', sent: 1240, replied: 89, escalated: 14, last: '5 min ago' },
];

const MOCK_LEADS = [
  { name: 'Marcus Chen', handle: '@marcuschen', stage: 'DM sent', time: '10 min ago', tag: 'SaaS' },
  { name: 'Sarah Williams', handle: '@sarahw', stage: 'Replied', time: '23 min ago', tag: 'Agency' },
  { name: 'Jake Rodriguez', handle: '@jakerod', stage: 'Escalated', time: '1 hour ago', tag: 'Startup' },
];

export default function OutreachPage() {
  const [tab, setTab] = useState<'campaigns' | 'leads' | 'analytics'>('campaigns');
  const [campaignStates, setCampaignStates] = useState<Record<number, string>>({ 1: 'active', 2: 'paused', 3: 'active' });

  const toggleCampaign = (id: number) => {
    setCampaignStates(prev => ({
      ...prev,
      [id]: prev[id] === 'active' ? 'paused' : 'active',
    }));
  };

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">IG Outreach</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>2 Active</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'inherit' }}>
            <Plus size={12} /> New Campaign
          </button>
        </div>
      </div>

      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Mass DM + AI Replies</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Automated Instagram outreach with intelligent response handling</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { icon: <Send size={13} />, val: '2,399', label: 'DMs Sent', sub: 'All time' },
                { icon: <MessageSquare size={13} />, val: '179', label: 'Replies', sub: 'Received' },
                { icon: <TrendingUp size={13} />, val: '25', label: 'Escalated', sub: 'To human' },
                { icon: <Users size={13} />, val: '3', label: 'Campaigns', sub: 'Active' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <div style={{ color: ACCENT }}>{s.icon}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>{s.val}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-3)', marginTop: 1 }}>{s.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '0 4px', borderBottom: '1px solid var(--border)', display: 'flex' }}>
                {(['campaigns', 'leads', 'analytics'] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: '12px 18px', fontSize: '12px', fontWeight: 600,
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    color: tab === t ? 'var(--text)' : 'var(--text-3)',
                    background: 'transparent', borderBottom: `2px solid ${tab === t ? ACCENT : 'transparent'}`, transition: 'all 0.15s',
                  }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {tab === 'campaigns' && (
                <div>
                  {MOCK_CAMPAIGNS.map((camp, i) => (
                    <motion.div key={camp.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ padding: '16px 18px', borderBottom: i < MOCK_CAMPAIGNS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: 3 }}>{camp.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: campaignStates[camp.id] === 'active' ? 'rgba(16,185,129,0.09)' : 'rgba(245,158,11,0.09)', color: campaignStates[camp.id] === 'active' ? 'var(--emerald)' : 'var(--amber)', border: `1px solid ${campaignStates[camp.id] === 'active' ? 'rgba(16,185,129,0.16)' : 'rgba(245,158,11,0.16)'}` }}>
                              {campaignStates[camp.id] === 'active' ? '● ' : '⏸ '}{campaignStates[camp.id]}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} /> {camp.last}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCampaign(camp.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${campaignStates[camp.id] === 'active' ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`, background: campaignStates[camp.id] === 'active' ? 'rgba(244,63,94,0.07)' : 'rgba(16,185,129,0.07)', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: campaignStates[camp.id] === 'active' ? 'var(--red)' : 'var(--emerald)', fontFamily: 'inherit' }}>
                          {campaignStates[camp.id] === 'active' ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Resume</>}
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {[
                          { label: 'Sent', val: camp.sent.toLocaleString() },
                          { label: 'Replied', val: camp.replied },
                          { label: 'Escalated', val: camp.escalated },
                        ].map((s) => (
                          <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 1 }}>{s.val}</div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {tab === 'leads' && (
                <div>
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>247 leads in queue</div>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: ACCENT, fontFamily: 'inherit' }}>
                      <Plus size={10} /> Add Leads
                    </button>
                  </div>
                  {MOCK_LEADS.map((lead, i) => (
                    <div key={lead.name} style={{ padding: '12px 18px', borderBottom: i < MOCK_LEADS.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: ACCENT, flexShrink: 0 }}>{lead.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700 }}>{lead.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{lead.handle} · {lead.tag}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', marginBottom: 2 }}>{lead.stage}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{lead.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'analytics' && (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Reply Rate', val: '7.5%', change: '+1.2% this week' },
                      { label: 'Avg Response Time', val: '4.2h', change: '-0.8h vs last week' },
                      { label: 'Escalation Rate', val: '14%', change: '+2% this week' },
                      { label: 'Active Leads', val: '247', change: '+38 this week' },
                    ].map((s) => (
                      <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-1px' }}>{s.val}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--emerald)', marginTop: 2 }}>{s.change}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>Daily DMs</div>
                  {[
                    { day: 'Mon', sent: 124 },
                    { day: 'Tue', sent: 89 },
                    { day: 'Wed', sent: 201 },
                    { day: 'Thu', sent: 156 },
                    { day: 'Fri', sent: 178 },
                    { day: 'Sat', sent: 67 },
                    { day: 'Sun', sent: 43 },
                  ].map((s) => (
                    <div key={s.day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', width: 28 }}>{s.day}</div>
                      <div style={{ flex: 1, height: 4, background: 'var(--surface-3)', borderRadius: 99 }}>
                        <div style={{ width: `${(s.sent / 201) * 100}%`, height: '100%', background: ACCENT, borderRadius: 99 }} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-2)', width: 50, textAlign: 'right' }}>{s.sent}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* AI Reply Settings */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>AI Reply Engine</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Auto-reply to DMs</div>
                  <div style={{ width: 36, height: 20, borderRadius: 99, background: ACCENT, position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', right: 2, top: 2, width: 14, height: 14, borderRadius: '50%', background: 'white' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Escalate on intent</div>
                  <div style={{ width: 36, height: 20, borderRadius: 99, background: ACCENT, position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', right: 2, top: 2, width: 14, height: 14, borderRadius: '50%', background: 'white' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Learning mode</div>
                  <div style={{ width: 36, height: 20, borderRadius: 99, background: 'var(--surface-3)', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', left: 2, top: 2, width: 14, height: 14, borderRadius: '50%', background: 'var(--text-3)' }} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent replies */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Recent Replies</div>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(16,185,129,0.09)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.16)' }}>6 new</span>
              </div>
              {[
                { lead: 'Marcus Chen', reply: 'This looks interesting, can we schedule a call?', time: '10 min ago', type: 'replied' },
                { lead: 'Sarah Williams', reply: 'Yes! Send me the details.', time: '23 min ago', type: 'interested' },
                { lead: 'Jake Rodriguez', reply: 'What pricing tiers do you offer?', time: '1 hour ago', type: 'question' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: 2 }}>{r.lead}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 4, fontStyle: 'italic' }}>"{r.reply}"</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'rgba(16,185,129,0.08)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.14)' }}>{r.type}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{r.time}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* DM templates */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>DM Templates</div>
                <button style={{ fontSize: '10.5px', fontWeight: 700, color: ACCENT, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>+ New</button>
              </div>
              {['Initial outreach', 'Follow-up #1', 'Value pitch', 'CTA — book call'].map((t, i) => (
                <div key={t} style={{ padding: '9px 14px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{t}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{['Used 124×', 'Used 89×', 'Used 56×', 'Used 41×'][i]}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
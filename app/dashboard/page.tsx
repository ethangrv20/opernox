'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { TrendingUp, Send, Users, Inbox, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({ campaigns: 0, accounts: 0, leads_total: 0, sent_total: 0, replies_new: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uid = user.id;
      const [a, b, c, d, e] = await Promise.all([
        supabase.from('campaigns').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('accounts').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('leads').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('sent_messages').select('id', { count: 'exact' }).eq('user_id', uid).eq('success', true),
        supabase.from('replies').select('id', { count: 'exact' }).eq('user_id', uid).eq('status', 'new'),
      ]);
      setStats({
        campaigns: a.count || 0,
        accounts: b.count || 0,
        leads_total: c.count || 0,
        sent_total: d.count || 0,
        replies_new: e.count || 0,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  const statBlocks = [
    { label: 'Campaigns', value: stats.campaigns, sub: 'Active flows', icon: <TrendingUp size={16} />, color: 'var(--violet)' },
    { label: 'Accounts', value: stats.accounts, sub: 'IG profiles connected', icon: <Users size={16} />, color: 'var(--green)' },
    { label: 'Leads', value: stats.leads_total, sub: 'In pipeline', icon: <Users size={16} />, color: 'var(--amber)' },
    { label: 'DMs Sent', value: stats.sent_total, sub: 'Delivered', icon: <Send size={16} />, color: 'var(--cyan)' },
    { label: 'Replies', value: stats.replies_new, sub: 'Awaiting response', icon: <Inbox size={16} />, color: 'var(--red)' },
  ];

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Overview</div>
        <Link href="/campaigns"><button className="btn btn-primary btn-sm"><Zap size={12} /> New Campaign</button></Link>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : (
          <>
            <div className="stat-grid">
              {statBlocks.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4 }}>
                  <div className="stat-block">
                    <div className="stat-icon" style={{ background: `${s.color}14`, border: `1px solid ${s.color}22`, color: s.color }}>{s.icon}</div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-sub">{s.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="section-hd"><h3>Quick actions</h3></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Create Campaign', sub: 'Set up a new outreach flow', icon: <Zap size={16} />, href: '/campaigns', color: 'var(--violet)' },
                { label: 'Add Leads', sub: 'Import your target list', icon: <Users size={16} />, href: '/leads', color: 'var(--green)' },
                { label: 'View Replies', sub: 'Check incoming messages', icon: <Inbox size={16} />, href: '/replies', color: 'var(--cyan)' },
              ].map((item, i) => (
                <motion.div key={item.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
                  <Link href={item.href}>
                    <div style={{
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'all 0.18s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = ''; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${item.color}14`, border: `1px solid ${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>{item.icon}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{item.label}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{item.sub}</div>
                        </div>
                      </div>
                      <ArrowRight size={15} style={{ color: 'var(--text-3)' }} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {stats.campaigns === 0 && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                style={{ marginTop: '28px', padding: '52px 32px', background: 'var(--surface)', border: '1px dashed var(--border-2)', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: 'var(--violet-dim)', border: '1px solid rgba(124,92,246,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--violet)' }}><Zap size={22} /></div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '7px' }}>No campaigns running yet</h3>
                <p style={{ color: 'var(--text-3)', fontSize: '13.5px', marginBottom: '20px' }}>Create your first campaign to start automating outreach.</p>
                <Link href="/campaigns"><button className="btn btn-primary"><Zap size={14} /> Create campaign</button></Link>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

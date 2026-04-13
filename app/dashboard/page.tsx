'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { TrendingUp, MessageSquare, Users, Inbox, Zap, ArrowRight, Activity, Send, BarChart3 } from 'lucide-react';
import Link from 'next/link';

function StatCard({ label, value, sub, icon, color, delay }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '11px',
        background: `${color}18`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '4px' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{sub}</div>}
    </motion.div>
  );
}

function QuickLink({ label, desc, icon, href, delay }: { label: string; desc: string; icon: React.ReactNode; href: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link href={href}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'var(--primary-pale)', border: '1px solid rgba(139,92,246,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary)', flexShrink: 0,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{desc}</div>
            </div>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--text3)', flexShrink: 0 }} />
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ campaigns: 0, accounts: 0, leads_total: 0, sent_total: 0, replies_new: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uid = user.id;
      const [campaigns, accounts, leads, sent, replies] = await Promise.all([
        supabase.from('campaigns').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('accounts').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('leads').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('sent_messages').select('id', { count: 'exact' }).eq('user_id', uid).eq('success', true),
        supabase.from('replies').select('id', { count: 'exact' }).eq('user_id', uid).eq('status', 'new'),
      ]);
      setStats({
        campaigns: campaigns.count || 0,
        accounts: accounts.count || 0,
        leads_total: leads.count || 0,
        sent_total: sent.count || 0,
        replies_new: replies.count || 0,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  const quickLinks = [
    { label: 'Create Campaign', desc: 'Set up a new outreach flow', icon: <Zap size={18} />, href: '/campaigns' },
    { label: 'Add Leads', desc: 'Import your target list', icon: <Users size={18} />, href: '/leads' },
    { label: 'View Replies', desc: 'Check incoming messages', icon: <Inbox size={18} />, href: '/replies' },
  ];

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <h2>Overview</h2>
        </div>
        <div className="topbar-right">
          <Link href="/campaigns">
            <button className="btn btn-primary btn-sm">
              <Zap size={13} />
              New Campaign
            </button>
          </Link>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard label="Campaigns" value={stats.campaigns} sub="Active outreach flows" icon={<TrendingUp size={18} />} color="#8b5cf6" delay={0} />
              <StatCard label="Accounts" value={stats.accounts} sub="Connected IG profiles" icon={<Activity size={18} />} color="#10b981" delay={0.05} />
              <StatCard label="Leads" value={stats.leads_total} sub="Total in pipeline" icon={<Users size={18} />} color="#f59e0b" delay={0.1} />
              <StatCard label="DMs Sent" value={stats.sent_total} sub="Successfully delivered" icon={<Send size={18} />} color="#06b6d4" delay={0.15} />
              <StatCard label="New Replies" value={stats.replies_new} sub="Awaiting response" icon={<Inbox size={18} />} color="#ef4444" delay={0.2} />
            </div>

            <div className="section-header">
              <h3>Quick actions</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {quickLinks.map((link, i) => (
                <QuickLink key={i} {...link} delay={0.25 + i * 0.07} />
              ))}
            </div>

            {stats.campaigns === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  marginTop: '28px',
                  padding: '44px',
                  background: 'var(--surface)',
                  border: '1px dashed var(--border2)',
                  borderRadius: 'var(--radius-xl)',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: 'var(--primary-pale)', border: '1px solid rgba(139,92,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', color: 'var(--primary)',
                }}>
                  <Zap size={22} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>No campaigns yet</h3>
                <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '20px' }}>
                  Create your first campaign to start automating outreach.
                </p>
                <Link href="/campaigns">
                  <button className="btn btn-primary">
                    Create campaign
                    <ArrowRight size={15} />
                  </button>
                </Link>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

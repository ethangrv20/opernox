'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { motion } from 'framer-motion';
import { TrendingUp, MessageSquare, Users, Inbox, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string;
}) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div className="stat-label">{label}</div>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: `${color}20`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', border: `1px solid ${color}30`,
        }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    campaigns: 0,
    accounts: 0,
    leads_total: 0,
    sent_total: 0,
    replies_new: 0,
  });
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
    { label: 'Create Campaign', href: '/campaigns', desc: 'Set up a new outreach flow', icon: <Zap size={20} /> },
    { label: 'Add Leads', href: '/leads', desc: 'Import your target list', icon: <Users size={20} /> },
    { label: 'View Replies', href: '/replies', desc: 'Check incoming messages', icon: <Inbox size={20} /> },
  ];

  return (
    <div>
      <div className="topbar">
        <h2>Overview</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/campaigns">
            <button className="btn btn-primary btn-sm">
              <Zap size={15} />
              New Campaign
            </button>
          </Link>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard
                label="Campaigns"
                value={stats.campaigns}
                sub="Active outreach flows"
                icon={<TrendingUp size={18} />}
                color="#7c5cfc"
              />
              <StatCard
                label="Accounts"
                value={stats.accounts}
                sub="Connected IG profiles"
                icon={<Users size={18} />}
                color="#22c55e"
              />
              <StatCard
                label="Leads"
                value={stats.leads_total}
                sub="Total in pipeline"
                icon={<Users size={18} />}
                color="#f59e0b"
              />
              <StatCard
                label="DMs Sent"
                value={stats.sent_total}
                sub="Successfully delivered"
                icon={<MessageSquare size={18} />}
                color="#3b82f6"
              />
              <StatCard
                label="New Replies"
                value={stats.replies_new}
                sub="Awaiting response"
                icon={<Inbox size={18} />}
                color="#ef4444"
              />
            </div>

            <div className="section-header">
              <h3>Quick actions</h3>
            </div>

            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {quickLinks.map((link, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <Link href={link.href}>
                    <div className="card" style={{ cursor: 'pointer', padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                            {link.label}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                            {link.desc}
                          </div>
                        </div>
                        <ArrowRight size={18} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {stats.campaigns === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  marginTop: '32px',
                  padding: '40px',
                  background: 'var(--surface)',
                  border: '1px dashed var(--border2)',
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                }}
              >
                <Zap size={40} style={{ color: 'var(--primary)', margin: '0 auto 16px', display: 'block', opacity: 0.6 }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                  No campaigns yet
                </h3>
                <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px' }}>
                  Create your first campaign to start automating outreach.
                </p>
                <Link href="/campaigns">
                  <button className="btn btn-primary">
                    Create campaign
                    <ArrowRight size={16} />
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

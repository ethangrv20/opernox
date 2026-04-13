'use client';
import { motion } from 'framer-motion';
import { Video, Twitter, Linkedin, Music, Wand2, Send, Users, MessageSquare, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';

const SYSTEMS = [
  {
    href: '/ugc',
    icon: <Video size={22} />,
    label: 'UGC System',
    desc: 'HeyGen + Instagram automation',
    color: 'var(--green)',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.15)',
    stat: '—',
    statLabel: 'Videos Generated',
  },
  {
    href: '/x-system',
    icon: <Twitter size={22} />,
    label: 'X System',
    desc: 'Twitter posts + queue management',
    color: 'var(--cyan)',
    bg: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.15)',
    stat: '—',
    statLabel: 'Posts Today',
  },
  {
    href: '/linkedin',
    icon: <Linkedin size={22} />,
    label: 'LinkedIn',
    desc: 'Content + article publishing',
    color: '#0A66C2',
    bg: 'rgba(10,102,194,0.08)',
    border: 'rgba(10,102,194,0.15)',
    stat: '—',
    statLabel: 'Posts Published',
  },
  {
    href: '/tiktok',
    icon: <Music size={22} />,
    label: 'TikTok',
    desc: 'Short-form video uploads',
    color: '#ff0050',
    bg: 'rgba(255,0,80,0.08)',
    border: 'rgba(255,0,80,0.15)',
    stat: '—',
    statLabel: 'Videos Posted',
  },
  {
    href: '/heygen',
    icon: <Wand2 size={22} />,
    label: 'HeyGen',
    desc: 'AI video generation pipeline',
    color: 'var(--violet)',
    bg: 'var(--violet-dim)',
    border: 'rgba(139,92,246,0.15)',
    stat: '—',
    statLabel: 'Videos Created',
  },
  {
    href: '/outreach',
    icon: <Send size={22} />,
    label: 'IG Outreach',
    desc: 'Mass DM + AI reply engine',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.08)',
    border: 'rgba(244,114,182,0.15)',
    stat: '—',
    statLabel: 'DMs Sent',
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Overview</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
          Mission Control — Opernox Platform
        </div>
      </div>

      <div className="page-content">
        {/* Hero row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 28 }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
            All Systems
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-3)' }}>
            Real-time status across your entire automation stack.
          </p>
        </motion.div>

        {/* Systems grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {SYSTEMS.map((sys, i) => (
            <motion.div
              key={sys.href}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link href={sys.href} className="system-card" style={{
                background: sys.bg,
                border: `1px solid ${sys.border}`,
                borderRadius: 14,
                padding: '20px 22px',
                display: 'block',
                textDecoration: 'none',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${sys.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: sys.color,
                  }}>
                    {sys.icon}
                  </div>
                  <div style={{
                    fontSize: '26px', fontWeight: 900, color: sys.color, letterSpacing: '-1px',
                    fontFamily: 'monospace',
                  }}>
                    {sys.stat}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, marginBottom: 3 }}>
                  {sys.statLabel}
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: 3, color: 'var(--text)' }}>
                  {sys.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  {sys.desc}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick stats row */}
        <div style={{ marginTop: 28 }}>
          <div className="section-hd" style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Quick Stats</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { icon: <MessageSquare size={16} />, val: '—', label: 'Total Replies', color: 'var(--green)' },
              { icon: <Users size={16} />, val: '—', label: 'Leads in Queue', color: 'var(--violet)' },
              { icon: <TrendingUp size={16} />, val: '—', label: 'DMs Sent', color: 'var(--cyan)' },
              { icon: <Zap size={16} />, val: '—', label: 'Active Campaigns', color: 'var(--amber)' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: '16px 18px', textAlign: 'center' }}>
                <div style={{ color: s.color, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-1px', color: 'var(--text)' }}>{s.val}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

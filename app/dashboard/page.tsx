'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Video, Twitter, Linkedin, Music, Send, ArrowRight, Users, Search } from 'lucide-react';

const SYSTEMS = [
  {
    href: '/ugc',
    icon: <Video size={18} />,
    label: 'Instagram UGC',
    desc: 'HeyGen + Instagram auto-posting',
    accent: '#10b981',
    route: '/ugc',
  },
  {
    href: '/x-system',
    icon: <Twitter size={18} />,
    label: 'X System',
    desc: 'Twitter posts + queue management',
    accent: '#06b6d4',
    route: '/x-system',
  },
  {
    href: '/linkedin',
    icon: <Linkedin size={18} />,
    label: 'LinkedIn',
    desc: 'Content + article publishing',
    accent: '#0ea5e9',
    route: '/linkedin',
  },
  {
    href: '/tiktok',
    icon: <Music size={18} />,
    label: 'TikTok UGC',
    desc: 'HeyGen + TikTok auto-posting',
    accent: '#f43f5e',
    route: '/tiktok',
  },
  {
    href: '/accounts',
    icon: <Users size={18} />,
    label: 'Accounts',
    desc: 'Connect + manage IG/AdsPower profiles',
    accent: '#8b5cf6',
    route: '/accounts',
  },
  {
    href: '/outreach',
    icon: <Send size={18} />,
    label: 'IG Outreach',
    desc: 'Mass DM + AI reply engine',
    accent: '#ec4899',
    route: '/outreach',
  },
  {
    href: '/monitor',
    icon: <Search size={18} />,
    label: 'SEO Monitor',
    desc: 'Keyword rankings, brand mentions, reviews & competitors',
    accent: '#f59e0b',
    route: '/monitor',
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Overview</div>
      </div>

      <div className="page-content">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 40 }}
        >
          <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            Automation Stack
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            Opernox Platform — all systems
          </p>
        </motion.div>

        {/* Systems list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 48 }}>
          {SYSTEMS.map((sys, i) => (
            <motion.div
              key={sys.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={sys.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 18px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${sys.accent}`,
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  marginBottom: 3,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-2)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{
                  width: 34, height: 34,
                  borderRadius: 8,
                  background: `rgba(${sys.accent === '#10b981' ? '16,185,129' : sys.accent === '#06b6d4' ? '6,182,212' : sys.accent === '#0ea5e9' ? '14,165,233' : sys.accent === '#f43f5e' ? '244,63,94' : sys.accent === '#8b5cf6' ? '139,92,246' : '236,72,153'},0.1)`,
                  border: `1px solid rgba(from ${sys.accent} r g b / 0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: sys.accent,
                  flexShrink: 0,
                }}>
                  {sys.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 2, color: 'var(--text)' }}>
                    {sys.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    {sys.desc}
                  </div>
                </div>
                <ArrowRight size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Platform status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: 'var(--emerald)',
              boxShadow: '0 0 8px var(--emerald)',
            }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Platform operational
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: 4 }}>
              — all systems ready
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

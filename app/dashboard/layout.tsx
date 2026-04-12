'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  MessageSquare,
  Inbox,
  LogOut,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard /> },
  { href: '/campaigns', label: 'Campaigns', icon: <Megaphone /> },
  { href: '/accounts', label: 'Accounts', icon: <Users /> },
  { href: '/leads', label: 'Leads', icon: <Users /> },
  { href: '/replies', label: 'Replies', icon: <Inbox /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login');
      else setUser(data.user);
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="btn btn-ghost btn-sm"
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 200,
          display: 'none',
        }}
        id="sidebar-toggle"
      >
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 150,
              display: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <div className="app-shell">
        {/* Sidebar */}
        <motion.aside
          className={`sidebar ${sidebarOpen ? 'open' : ''}`}
          initial={{ x: -240 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ zIndex: 160 }}
        >
          <div className="sidebar-logo">
            <h1>Opernox</h1>
            <span>AI Platform</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="btn btn-ghost btn-sm"
              style={{ position: 'absolute', top: '20px', right: '12px', display: 'none' }}
              id="sidebar-close"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? 'active' : ''}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div style={{ padding: '0 14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                {user.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </motion.aside>

        {/* Main content */}
        <main className="main-content">{children}</main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #sidebar-toggle { display: flex !important; }
          #sidebar-close { display: flex !important; }
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0) !important; }
          .main-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  );
}

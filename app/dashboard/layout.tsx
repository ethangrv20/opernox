'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Video,
  Twitter,
  Linkedin,
  Music,
  Send,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Overview',       icon: <LayoutDashboard size={16} /> },
  { href: '/ugc',         label: 'Instagram UGC',  icon: <Video size={16} /> },
  { href: '/x-system',    label: 'X System',       icon: <Twitter size={16} /> },
  { href: '/linkedin',    label: 'LinkedIn',       icon: <Linkedin size={16} /> },
  { href: '/tiktok',      label: 'TikTok UGC',     icon: <Music size={16} /> },
  { href: '/accounts',    label: 'Accounts',       icon: <Users size={16} /> },
  { href: '/outreach',    label: 'IG Outreach',    icon: <Send size={16} /> },
  { href: '/client-config', label: 'Client Config', icon: <Settings size={16} /> },
  { href: '/admin/vps',    label: 'Admin: VPS',     icon: <Settings size={16} /> },
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
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-top">
          <Link href="/dashboard" className="sidebar-logo-link">
            <div className="sidebar-logo">Opernox<span>Platform</span></div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS
            .filter(item => {
              // Hide admin links from non-admin users
              if (item.href.startsWith('/admin') && user.email !== 'ethangrv@gmail.com') return false;
              return true;
            })
            .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'nav-item--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user.email?.split('@')[0]}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
          <button onClick={handleLogout} className="nav-item" style={{ color: 'var(--red)', opacity: 0.8 }}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Main content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

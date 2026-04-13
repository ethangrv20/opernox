'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Inbox,
  LogOut,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { href: '/campaigns', label: 'Campaigns', icon: <Megaphone size={16} /> },
  { href: '/accounts', label: 'Accounts', icon: <Users size={16} /> },
  { href: '/leads', label: 'Leads', icon: <Users size={16} /> },
  { href: '/replies', label: 'Replies', icon: <Inbox size={16} /> },
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo">
            Opernox<span>Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
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
          <div style={{ padding: '0 12px', marginBottom: '10px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ width: '100%', color: 'var(--red)', opacity: 0.8 }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            zIndex: 99, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mobile-toggle"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Main content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

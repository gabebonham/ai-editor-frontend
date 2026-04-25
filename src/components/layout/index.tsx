import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, MessageSquare, GitPullRequest, Settings, LogOut, Menu, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const nav = [
  { to: '/', icon: LayoutGrid, label: 'Projects' },
  { to: '/prompt', icon: MessageSquare, label: 'Prompt' },
  { to: '/changes', icon: GitPullRequest, label: 'Changes' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch { /* best-effort */ }
    logout();
  };

  const sidebarContent = (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100%',
      background: 'var(--bg-elevated)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24,
            background: 'var(--text-primary)',
            borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L6 2L10 10M3.5 7.5h5" stroke="var(--bg)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em' }}>AI Editor</span>
        </div>
        {isMobile && (
          <button onClick={() => setOpen(false)} style={{ color: 'var(--text-secondary)', display: 'flex' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: '8px', flex: 1 }}>
        {nav.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--bg-sunken)' : 'transparent',
                fontWeight: active ? 500 : 400,
                fontSize: 13,
                transition: 'all 0.1s',
                marginBottom: 1,
              }}
            >
              <Icon size={14} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Link
          to="/settings"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px',
            borderRadius: 'var(--radius-md)',
            color: pathname === '/settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: pathname === '/settings' ? 'var(--bg-sunken)' : 'transparent',
            fontSize: 13,
          }}
        >
          <Settings size={14} strokeWidth={1.5} />
          Settings
        </Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', marginTop: 2 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--bg-sunken)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0,
            }}>
              {user.email[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{ display: 'flex', color: 'var(--text-tertiary)', padding: 2, borderRadius: 'var(--radius-sm)', transition: 'color 0.1s', flexShrink: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <LogOut size={12} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile top bar */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          height: 52,
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, background: 'var(--text-primary)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 10L6 2L10 10M3.5 7.5h5" stroke="var(--bg)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: 13 }}>AI Editor</span>
          </div>
          <button onClick={() => setOpen(true)} style={{ color: 'var(--text-primary)', display: 'flex', padding: 4 }}>
            <Menu size={20} />
          </button>
        </div>

        {/* Drawer backdrop */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 299,
              background: 'rgba(0,0,0,0.3)',
              animation: 'fadeIn 0.15s ease',
            }}
          />
        )}

        {/* Drawer */}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 300,
          width: 'var(--sidebar-width)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop: fixed sidebar
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
      {sidebarContent}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{
        marginLeft: isMobile ? 0 : 'var(--sidebar-width)',
        marginTop: isMobile ? 52 : 0,
        flex: 1,
        minHeight: isMobile ? 'calc(100vh - 52px)' : '100vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 32px) 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 'clamp(15px, 3vw, 18px)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: description ? 3 : 0 }}>{title}</h1>
        {description && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{description}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

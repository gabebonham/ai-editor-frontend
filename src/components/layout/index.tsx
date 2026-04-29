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

  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch { /* best-effort */ }
    logout();
  };

  const sidebarContent = (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {/* Logo box: 28×28px, bg accent-secondary (#e63946), "AI" text */}
          <div style={{
            width: 28,
            height: 28,
            background: 'var(--accent-secondary)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 10,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}>AI</span>
          </div>
          <span style={{
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}>
            AI Site Manager
          </span>
        </div>
        {isMobile && (
          <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)', display: 'flex' }}>
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
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                /* Active: left red indicator + tinted bg + red text */
                borderLeft: active ? '3px solid var(--accent-secondary)' : '3px solid transparent',
                borderRadius: active ? '0 8px 8px 0' : 'var(--radius-md)',
                background: active ? 'rgba(230,57,70,0.07)' : 'transparent',
                color: active ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                transition: 'all 0.1s',
                marginBottom: 1,
                textDecoration: 'none',
              }}
            >
              <Icon size={14} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Link
          to="/settings"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px',
            borderLeft: pathname === '/settings' ? '3px solid var(--accent-secondary)' : '3px solid transparent',
            borderRadius: pathname === '/settings' ? '0 8px 8px 0' : 'var(--radius-md)',
            background: pathname === '/settings' ? 'rgba(230,57,70,0.07)' : 'transparent',
            color: pathname === '/settings' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: pathname === '/settings' ? 600 : 400,
            transition: 'all 0.1s',
          }}
        >
          <Settings size={14} strokeWidth={pathname === '/settings' ? 2 : 1.5} />
          Settings
        </Link>

        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 10px',
            marginTop: 4,
            borderTop: '1px solid var(--border)',
          }}>
            {/* Avatar */}
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#ffffff',
              flexShrink: 0,
            }}>
              {user.email[0].toUpperCase()}
            </div>
            <span style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{ display: 'flex', color: 'var(--text-muted)', padding: 2, borderRadius: 'var(--radius-sm)', transition: 'color 0.1s', flexShrink: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
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
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, background: 'var(--accent-secondary)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 9, color: '#fff', letterSpacing: '-0.02em' }}>AI</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>AI Site Manager</span>
          </div>
          <button onClick={() => setOpen(true)} style={{ color: 'var(--text-primary)', display: 'flex', padding: 4 }}>
            <Menu size={20} />
          </button>
        </div>

        {open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 299,
              background: 'rgba(29,53,87,0.25)',
              animation: 'fadeIn 0.15s ease',
            }}
          />
        )}

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
        background: 'var(--bg)',
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
      padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) 20px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-card)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{
          fontSize: 'clamp(15px,3vw,18px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          marginBottom: description ? 3 : 0,
        }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{description}</p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

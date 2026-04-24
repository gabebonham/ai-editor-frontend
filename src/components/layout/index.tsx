import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, MessageSquare, GitPullRequest, Settings, LogOut } from 'lucide-react';
import { api, clearToken } from '../../lib/api';
import type { User } from '../../lib/api';

const nav = [
  { to: '/', icon: LayoutGrid, label: 'Projects' },
  { to: '/prompt', icon: MessageSquare, label: 'Prompt' },
  { to: '/changes', icon: GitPullRequest, label: 'Changes' },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => null);
  }, []);

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch { /* best-effort */ }
    clearToken();
    navigate('/login');
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'var(--bg-elevated)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24,
            height: 24,
            background: 'var(--text-primary)',
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L6 2L10 10M3.5 7.5h5" stroke="var(--bg)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em' }}>AI Editor</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '8px 8px', flex: 1 }}>
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
                padding: '7px 10px',
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
            display: 'flex',
            alignItems: 'center',
            gap: 8,
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

        {/* User + logout */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 10px',
            marginTop: 2,
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'var(--bg-sunken)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}>
              {user.email[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-tertiary)',
                padding: 2,
                borderRadius: 'var(--radius-sm)',
                transition: 'color 0.1s',
                flexShrink: 0,
              }}
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
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{
        marginLeft: 'var(--sidebar-width)',
        flex: 1,
        height: '100vh',
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
      padding: '28px 32px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: description ? 3 : 0 }}>{title}</h1>
        {description && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{description}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

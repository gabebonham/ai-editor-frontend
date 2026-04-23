import React from 'react';

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
}

export function Button({
  variant = 'ghost',
  size = 'md',
  loading,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    transition: 'all 0.12s ease',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    padding: size === 'sm' ? '4px 10px' : '7px 14px',
    fontSize: size === 'sm' ? 12 : 13,
    whiteSpace: 'nowrap',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--text-primary)',
      color: 'var(--bg)',
      border: '1px solid var(--text-primary)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'transparent',
      color: 'var(--accent)',
      border: '1px solid var(--border)',
    },
  };

  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={12} /> : null}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <input
        style={{
          background: 'var(--surface)',
          border: `1px solid ${error ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '7px 10px',
          color: 'var(--text-primary)',
          fontSize: 13,
          width: '100%',
          transition: 'border-color 0.12s',
          ...style,
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: 'var(--accent)' }}>{error}</span>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'amber' | 'red';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const colors: Record<string, React.CSSProperties> = {
    default: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' },
    green:   { background: 'var(--green-subtle)', color: 'var(--green)' },
    amber:   { background: 'var(--amber-subtle)', color: 'var(--amber)' },
    red:     { background: 'var(--accent-subtle)', color: 'var(--accent)' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 7px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '0.02em',
      ...colors[variant],
    }}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" />
      <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

export function Empty({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      gap: 12,
      textAlign: 'center',
    }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{icon}</div>
      <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{title}</p>
      {description && <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 280 }}>{description}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '0' }} />;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export function Toast({ message, type = 'default', onDismiss }: {
  message: string;
  type?: 'default' | 'success' | 'error';
  onDismiss: () => void;
}) {
  const colors: Record<string, React.CSSProperties> = {
    default: { background: 'var(--text-primary)', color: 'var(--bg)' },
    success: { background: 'var(--green)', color: '#fff' },
    error:   { background: 'var(--accent)', color: '#fff' },
  };

  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 18px',
      borderRadius: 'var(--radius-md)',
      fontSize: 13,
      fontWeight: 500,
      boxShadow: 'var(--shadow-lg)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      animation: 'slideUp 0.2s ease',
      ...colors[type],
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform: translateX(-50%) translateY(8px) } to { opacity:1; transform: translateX(-50%) translateY(0) } }`}</style>
      {message}
      <button onClick={onDismiss} style={{ opacity: 0.6, marginLeft: 4, color: 'inherit', fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
}

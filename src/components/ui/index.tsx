import React from 'react';

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
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
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    transition: 'all 0.12s ease',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.55 : 1,
    padding: size === 'sm' ? '5px 10px' : '7px 14px',
    fontSize: size === 'sm' ? 12 : 13,
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--accent)',
      color: 'var(--accent-text)',
      border: '1px solid var(--accent)',
    },
    secondary: {
      background: 'var(--bg-card)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'transparent',
      color: 'var(--error)',
      border: '1px solid transparent',
    },
    outline: {
      background: 'transparent',
      color: 'var(--accent)',
      border: '1px solid var(--accent)',
    },
  };

  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        const el = e.currentTarget;
        if (variant === 'primary') { el.style.background = 'var(--accent-hover)'; el.style.borderColor = 'var(--accent-hover)'; }
        if (variant === 'secondary') { el.style.background = 'var(--bg-secondary)'; }
        if (variant === 'ghost') { el.style.background = 'var(--bg-secondary)'; el.style.borderColor = 'var(--border)'; }
        if (variant === 'danger') { el.style.background = 'var(--danger-bg)'; el.style.borderColor = 'rgba(230,57,70,0.3)'; }
        if (variant === 'outline') { el.style.background = 'var(--badge-bg)'; }
      }}
      onMouseLeave={(e) => {
        if (disabled || loading) return;
        const el = e.currentTarget;
        Object.assign(el.style, variants[variant]);
      }}
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
  note?: string;
  error?: string;
}

export function Input({ label, note, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '7px 10px',
          color: 'var(--text-primary)',
          fontSize: 13,
          width: '100%',
          transition: 'border-color 0.12s, box-shadow 0.12s',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,119,182,0.1)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--border)';
          e.currentTarget.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {note && !error && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note}</span>}
      {error && <span style={{ fontSize: 11, color: 'var(--error)' }}>{error}</span>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'amber' | 'red' | 'gray';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const colors: Record<string, React.CSSProperties> = {
    default: { background: 'var(--badge-bg)', color: 'var(--badge-text)' },
    green:   { background: 'var(--success-bg)', color: 'var(--success)' },
    amber:   { background: 'rgba(166,92,0,0.1)', color: '#a65c00' },
    red:     { background: 'var(--danger-bg)', color: 'var(--error)' },
    gray:    { background: '#f0f0f0', color: 'var(--text-muted)' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
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

export function Card({ children, style, onClick }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'border-color 0.12s, box-shadow 0.12s',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-accent)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
      } : undefined}
    >
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
      padding: '72px 24px',
      gap: 12,
      textAlign: 'center',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{icon}</div>
      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{title}</p>
      {description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 300, lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
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
    default: { background: 'var(--text-primary)', color: 'var(--bg-card)' },
    success: { background: 'var(--success)', color: '#fff' },
    error:   { background: 'var(--error)', color: '#fff' },
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
      whiteSpace: 'nowrap',
      ...colors[type],
    }}>
      {message}
      <button
        onClick={onDismiss}
        style={{ opacity: 0.7, marginLeft: 4, color: 'inherit', fontSize: 16, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}

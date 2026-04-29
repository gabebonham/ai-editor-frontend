import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Toast } from '../components/ui';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuth, login } = useAuth();
  const [mode, setMode] = useState<Mode>('login');

  useEffect(() => {
    if (isAuth) navigate('/', { replace: true });
  }, [isAuth, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Required';
    else if (mode === 'register' && password.length < 8) e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await api.auth.register(email, password);
        login(res.accessToken);
        navigate('/');
        return;
      }
      const res = await api.auth.login(email, password);
      login(res.accessToken);
      navigate('/');
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setErrors({});
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 36,
          justifyContent: 'center',
        }}>
          <div style={{
            width: 36,
            height: 36,
            background: 'var(--accent-secondary)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#ffffff', letterSpacing: '-0.03em' }}>AI</span>
          </div>
          <span style={{
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}>
            AI Site Manager
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          padding: '32px 32px 28px',
        }}>
          <h1 style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 4,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
            {mode === 'login'
              ? 'Welcome back. Edit your site with AI.'
              : 'Start editing your site with natural language.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </div>

        {/* Toggle */}
        <p style={{
          textAlign: 'center',
          marginTop: 18,
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Link
            to="#"
            onClick={(e) => { e.preventDefault(); toggleMode(); }}
            style={{ color: 'var(--accent)', fontWeight: 500 }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Layout, PageHeader } from '../components/layout';
import { Card, Input, Button, Toast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    try {
      await api.auth.updateApiKey(apiKey.trim());
      setApiKey('');
      setToast({ message: 'API key saved', type: 'success' });
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    } finally {
      setSavingKey(false);
    }
  };

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch { /* best-effort */ }
    logout();
  };

  const handleConnectGitHub = () => {
    window.location.href = api.github.authorizeUrl();
  };

  return (
    <Layout>
      <PageHeader
        title="Settings"
        description="Account and connection configuration"
        action={
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut size={13} /> Sign out
          </Button>
        }
      />
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>

        {/* Account */}
        {user && (
          <Card style={{ padding: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Account</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.email}</span>
            </div>
          </Card>
        )}

        {/* Anthropic API Key */}
        <Card style={{ padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Anthropic API Key</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Required for AI prompt processing. Your key is stored securely on the server.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Input
                type="password"
                placeholder="sk-ant-…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
              />
            </div>
            <Button variant="primary" onClick={handleSaveApiKey} loading={savingKey}>
              Save
            </Button>
          </div>
        </Card>

        {/* GitHub OAuth */}
        <Card style={{ padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>GitHub OAuth</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Connect your GitHub account to authorize repository access.
          </p>
          <Button variant="primary" onClick={handleConnectGitHub}>
            Connect GitHub
          </Button>
        </Card>

        {/* API Connection */}
        <Card style={{ padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>API Connection</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Backend URL"
              value={apiUrl}
              readOnly
              style={{ opacity: 0.7 }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Configure via <code style={{ fontFamily: 'var(--font-sans)', fontSize: 11 }}>VITE_API_URL</code> in your <code style={{ fontFamily: 'var(--font-sans)', fontSize: 11 }}>.env</code> file.
            </p>
          </div>
        </Card>

        {/* About */}
        <Card style={{ padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>About</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Version', '1.0.0'],
              ['Stack', 'React + Vite + TypeScript'],
              ['Backend', 'NestJS + TypeORM + Neon'],
              ['AI', 'Claude Sonnet (Anthropic)'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </Layout>
  );
}

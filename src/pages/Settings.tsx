import { Layout, PageHeader } from '../components/layout';
import { Card, Input, Button } from '../components/ui';

export default function SettingsPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

  return (
    <Layout>
      <PageHeader title="Settings" description="API and connection configuration" />
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
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

        <Card style={{ padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>GitHub OAuth</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Connect your GitHub account to authorize repository access.
          </p>
          <Button
            variant="primary"
            onClick={() => window.open(`${apiUrl}/github/oauth/authorize`, '_blank')}
          >
            Connect GitHub
          </Button>
        </Card>

        <Card style={{ padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>About</h2>
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
    </Layout>
  );
}

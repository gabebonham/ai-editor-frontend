import { useState } from 'react';
import { GitPullRequest, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Layout, PageHeader } from '../components/layout';
import { Badge, Empty } from '../components/ui';

// This page would fetch from GET /api/changes in a real app.
// For now, it shows a placeholder with the data model.

const mockChanges = [
  {
    id: '1',
    prompt: 'Add a login button to the header navigation',
    summary: 'Added LoginButton component to Header with routing to /auth/login',
    confidence: 0.95,
    status: 'applied',
    prUrl: 'https://github.com/acme/repo/pull/12',
    prNumber: 12,
    filesChanged: [{ path: 'src/components/Header.tsx', description: 'Added login button' }],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    prompt: 'Change the hero section background to a gradient',
    summary: 'Updated hero section with linear gradient background',
    confidence: 0.88,
    status: 'applied',
    prUrl: 'https://github.com/acme/repo/pull/11',
    prNumber: 11,
    filesChanged: [{ path: 'src/pages/Home.tsx', description: 'Changed background style' }],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    prompt: 'Refactor the entire auth system',
    summary: '⚠️ Low confidence: Too broad — suggest narrowing the scope',
    confidence: 0.22,
    status: 'cancelled',
    filesChanged: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

const statusMap = {
  applied: { label: 'Applied', variant: 'green' as const, icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'default' as const, icon: XCircle },
  pending: { label: 'Pending', variant: 'amber' as const, icon: Clock },
  failed: { label: 'Failed', variant: 'red' as const, icon: AlertCircle },
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export default function ChangesPage() {
  const [changes] = useState(mockChanges);

  return (
    <Layout>
      <PageHeader
        title="Changes"
        description="History of AI-generated code changes and pull requests"
      />
      <div style={{ padding: '24px 32px' }}>
        {changes.length === 0 ? (
          <Empty
            icon={<GitPullRequest size={28} />}
            title="No changes yet"
            description="Changes will appear here after you send prompts and apply them."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {changes.map((change, i) => {
              const s = statusMap[change.status as keyof typeof statusMap] ?? statusMap.pending;
              const StatusIcon = s.icon;
              const isFirst = i === 0;
              const isLast = i === changes.length - 1;

              return (
                <div
                  key={change.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: isFirst && isLast ? 'var(--radius-lg)'
                      : isFirst ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-sm)'
                      : isLast ? 'var(--radius-sm) var(--radius-sm) var(--radius-lg) var(--radius-lg)'
                      : 'var(--radius-sm)',
                    padding: '14px 18px',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Status icon */}
                  <div style={{ marginTop: 1, flexShrink: 0 }}>
                    <StatusIcon
                      size={15}
                      color={change.status === 'applied' ? 'var(--green)'
                        : change.status === 'cancelled' ? 'var(--text-tertiary)'
                        : 'var(--amber)'}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{change.prompt}</span>
                      <Badge variant={s.variant}>{s.label}</Badge>
                      {change.prNumber && (
                        <a
                          href={change.prUrl}
                          target="_blank"
                          rel="noopener"
                          style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'underline' }}
                        >
                          PR #{change.prNumber}
                        </a>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: change.filesChanged.length > 0 ? 6 : 0 }}>
                      {change.summary}
                    </p>
                    {change.filesChanged.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {change.filesChanged.map((f) => (
                          <code key={f.path} style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-sans)',
                          }}>
                            {f.path}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 1 }}>
                    {timeAgo(change.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

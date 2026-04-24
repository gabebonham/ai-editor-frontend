import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, ChevronDown, ChevronRight,
  Code2, GitPullRequest, Loader2, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import { Layout, PageHeader } from '../components/layout';
import { Button, Card, Toast, Spinner, Badge } from '../components/ui';
import { api } from '../lib/api';
import type { WidgetPreviewResult, FileChangeDiff } from '../lib/api';

type Step = 'loading' | 'review' | 'injecting' | 'done' | 'error';

export default function WidgetPreviewPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const projectId = params.get('project') ?? '';

  const [step, setStep] = useState<Step>('loading');
  const [preview, setPreview] = useState<WidgetPreviewResult | null>(null);
  const [prUrl, setPrUrl] = useState('');
  const [prNumber, setPrNumber] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    if (!projectId) {
      navigate('/');
      return;
    }
    loadPreview();
  }, [projectId]);

  async function loadPreview() {
    setStep('loading');
    try {
      const result = await api.snippet.preview(projectId);
      setPreview(result);
      setStep('review');
      // Auto-expand the first file
      if (result.files.length > 0) setExpandedFile(result.files[0].path);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStep('error');
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setStep('injecting');
    try {
      const result = await api.snippet.inject(projectId);
      setPrUrl(result.prUrl);
      setPrNumber(result.prNumber);
      setStep('done');
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
      setStep('review');
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Widget preview"
        description="Review the changes Claude will make before creating the pull request"
        action={
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft size={13} /> Back to projects
          </Button>
        }
      />

      <div style={{ padding: '24px 32px', flex: 1, overflow: 'auto' }}>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {step === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80 }}>
            <Spinner size={24} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Claude is generating the chat widget and analyzing your repository…
            </p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {step === 'error' && (
          <Card style={{ padding: 32, textAlign: 'center', maxWidth: 480, margin: '60px auto' }}>
            <AlertTriangle size={28} color="var(--accent)" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Failed to generate preview</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Button variant="ghost" onClick={() => navigate('/')}>Back to projects</Button>
              <Button variant="primary" onClick={loadPreview}>Try again</Button>
            </div>
          </Card>
        )}

        {/* ── Injecting ───────────────────────────────────────────────────── */}
        {step === 'injecting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80 }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="var(--text-secondary)" />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Creating pull request on GitHub…
            </p>
          </div>
        )}

        {/* ── Done ────────────────────────────────────────────────────────── */}
        {step === 'done' && (
          <Card style={{ padding: 40, textAlign: 'center', maxWidth: 480, margin: '60px auto' }}>
            <CheckCircle size={32} color="var(--green)" style={{ marginBottom: 16 }} />
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Pull request created!</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
              PR #{prNumber} is open on GitHub. Review and merge it to activate the chat widget on your site.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={prUrl} target="_blank" rel="noopener">
                <Button variant="primary">
                  <GitPullRequest size={13} /> View PR #{prNumber}
                </Button>
              </a>
              <Button variant="ghost" onClick={() => navigate('/')}>Back to projects</Button>
            </div>
          </Card>
        )}

        {/* ── Review ──────────────────────────────────────────────────────── */}
        {step === 'review' && preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>

            {/* Summary bar */}
            <Card style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <CheckCircle size={15} color="var(--green)" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                Widget generated — {preview.files.length} file{preview.files.length !== 1 ? 's' : ''} will be modified
              </span>
              <Badge variant="default">Ready to apply</Badge>
            </Card>

            {/* Script tag info */}
            <Card style={{ overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => setShowWidget(!showWidget)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Code2 size={14} color="var(--text-secondary)" />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Script tag being injected</span>
                </div>
                {showWidget ? <ChevronDown size={13} color="var(--text-secondary)" /> : <ChevronRight size={13} color="var(--text-secondary)" />}
              </div>
              {showWidget && (
                <pre style={{
                  padding: '14px 16px',
                  background: 'var(--bg-sunken)',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  lineHeight: 1.7,
                  overflow: 'auto',
                  margin: 0,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {preview.scriptTag}
                </pre>
              )}
            </Card>

            {/* Per-file diffs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {preview.files.map((file) => (
                <FileDiff
                  key={file.path}
                  file={file}
                  expanded={expandedFile === file.path}
                  onToggle={() => setExpandedFile(expandedFile === file.path ? null : file.path)}
                />
              ))}
            </div>

            {/* Action bar */}
            <div style={{
              position: 'sticky',
              bottom: 0,
              background: 'var(--bg-elevated)',
              borderTop: '1px solid var(--border)',
              padding: '14px 0',
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
            }}>
              <Button variant="ghost" onClick={() => navigate('/')}>
                <XCircle size={13} /> Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirm}>
                <GitPullRequest size={13} /> Confirm &amp; create PR
              </Button>
            </div>

          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
}

// ── FileDiff component ────────────────────────────────────────────────────────

function FileDiff({ file, expanded, onToggle }: {
  file: FileChangeDiff;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'diff' | 'original' | 'modified'>('diff');

  const diffLines = computeDiff(file.original, file.modified);

  return (
    <Card style={{ overflow: 'hidden' }}>
      {/* File header */}
      <div
        onClick={onToggle}
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border)' : 'none',
        }}
      >
        {expanded ? <ChevronDown size={13} color="var(--text-secondary)" /> : <ChevronRight size={13} color="var(--text-secondary)" />}
        <code style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)', flex: 1 }}>
          {file.path}
        </code>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{file.description}</span>
        <Badge variant="green">+{diffLines.filter(l => l.type === 'add').length}</Badge>
      </div>

      {/* Diff body */}
      {expanded && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            {(['diff', 'original', 'modified'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '7px 14px',
                  fontSize: 12,
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  borderBottom: activeTab === tab ? '2px solid var(--text-primary)' : '2px solid transparent',
                  fontWeight: activeTab === tab ? 500 : 400,
                  background: 'transparent',
                  transition: 'all 0.1s',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ maxHeight: 320, overflow: 'auto', background: 'var(--bg-sunken)' }}>
            {activeTab === 'diff' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7 }}>
                <tbody>
                  {diffLines.map((line, i) => (
                    <tr
                      key={i}
                      style={{
                        background: line.type === 'add'
                          ? 'rgba(34,197,94,0.08)'
                          : line.type === 'remove'
                          ? 'rgba(239,68,68,0.08)'
                          : 'transparent',
                      }}
                    >
                      <td style={{
                        width: 20,
                        paddingLeft: 12,
                        color: line.type === 'add' ? 'var(--green)' : line.type === 'remove' ? 'var(--accent)' : 'var(--text-tertiary)',
                        userSelect: 'none',
                        verticalAlign: 'top',
                      }}>
                        {line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '}
                      </td>
                      <td style={{ padding: '0 12px 0 6px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {line.text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'original' && (
              <pre style={{ margin: 0, padding: '12px 16px', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {file.original || '(empty)'}
              </pre>
            )}
            {activeTab === 'modified' && (
              <pre style={{ margin: 0, padding: '12px 16px', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {file.modified}
              </pre>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

// ── Diff algorithm ────────────────────────────────────────────────────────────

type DiffLine = { type: 'add' | 'remove' | 'context'; text: string };

function computeDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff — good enough for HTML template files
  const lcs = buildLCS(origLines, modLines);
  let oi = 0, mi = 0, li = 0;

  while (oi < origLines.length || mi < modLines.length) {
    if (li < lcs.length && oi < origLines.length && origLines[oi] === lcs[li] && mi < modLines.length && modLines[mi] === lcs[li]) {
      result.push({ type: 'context', text: origLines[oi] });
      oi++; mi++; li++;
    } else if (mi < modLines.length && (li >= lcs.length || modLines[mi] !== lcs[li])) {
      result.push({ type: 'add', text: modLines[mi] });
      mi++;
    } else {
      result.push({ type: 'remove', text: origLines[oi] });
      oi++;
    }
  }

  return result;
}

function buildLCS(a: string[], b: string[]): string[] {
  // Cap for perf — beyond 200 lines just show a simple header+footer context
  if (a.length > 200 || b.length > 200) {
    const added = b.filter(l => !a.includes(l));
    const removed = a.filter(l => !b.includes(l));
    return b.filter(l => !added.includes(l) && !removed.includes(l));
  }

  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const lcs: string[] = [];
  let i = a.length, j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { lcs.unshift(a[i - 1]); i--; j--; }
    else if (dp[i - 1][j] > dp[i][j - 1]) i--;
    else j--;
  }
  return lcs;
}

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, ChevronDown, ChevronRight,
  Code2, GitPullRequest, AlertTriangle, ArrowLeft,
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
      setErrorMsg('No project selected. Go back and click "Inject chat widget" on a project.');
      setStep('error');
      return;
    }
    loadPreview();
  }, [projectId]);

  async function loadPreview() {
    setStep('loading');
    setErrorMsg('');
    try {
      const result = await api.snippet.preview(projectId);
      setPreview(result);
      setStep('review');
      if (result.files.length > 0) setExpandedFile(result.files[0].path);
    } catch (err) {
      const msg = (err as Error).message;
      setErrorMsg(msg);
      setToast({ message: `Error: ${msg}`, type: 'error' });
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

        {/* Loading */}
        {step === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80 }}>
            <Spinner size={24} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 340 }}>
              Claude is generating the chat widget and analyzing your repository…
              <br />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                This may take 15–30 seconds.
              </span>
            </p>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <Card style={{ padding: 32, textAlign: 'center', maxWidth: 480, margin: '60px auto' }}>
            <AlertTriangle size={28} color="var(--accent)" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Something went wrong</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              {errorMsg || 'An unexpected error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Button variant="ghost" onClick={() => navigate('/')}>Back to projects</Button>
              {projectId && <Button variant="primary" onClick={loadPreview}>Try again</Button>}
            </div>
          </Card>
        )}

        {/* Injecting */}
        {step === 'injecting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80 }}>
            <Spinner size={24} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Creating pull request on GitHub…
            </p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <Card style={{ padding: 40, textAlign: 'center', maxWidth: 480, margin: '60px auto' }}>
            <CheckCircle size={32} color="var(--green)" style={{ marginBottom: 16 }} />
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Pull request created!</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
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

        {/* Review */}
        {step === 'review' && preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, width: '100%' }}>

            {/* Summary bar */}
            <Card style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <CheckCircle size={15} color="var(--green)" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                Widget generated —{' '}
                {preview.files.length > 0
                  ? `${preview.files.length} file${preview.files.length !== 1 ? 's' : ''} will be modified`
                  : 'no HTML template files found in this repo'}
              </span>
              <div style={{ marginLeft: 'auto' }}>
                <Badge variant="green">Ready to apply</Badge>
              </div>
            </Card>

            {/* No files warning */}
            {preview.files.length === 0 && (
              <Card style={{ padding: 24 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <AlertTriangle size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>No HTML template files detected</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Claude couldn't find an <code>index.html</code>, <code>_document.tsx</code>, or layout file to inject the script tag into.
                      You can add the script tag manually before the <code>&lt;/body&gt;</code> tag.
                    </p>
                    {preview.scriptTag && (
                      <pre style={{
                        marginTop: 12,
                        padding: '10px 12px',
                        background: 'var(--bg-sunken)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        color: 'var(--text-secondary)',
                      }}>
                        {preview.scriptTag}
                      </pre>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Script tag */}
            {preview.scriptTag && (
              <Card style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: showWidget ? '1px solid var(--border)' : 'none',
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
                  {showWidget
                    ? <ChevronDown size={13} color="var(--text-secondary)" />
                    : <ChevronRight size={13} color="var(--text-secondary)" />}
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
            )}

            {/* Per-file diffs */}
            {preview.files.length > 0 && (
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
            )}

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
              {preview.files.length > 0 && (
                <Button variant="primary" onClick={handleConfirm}>
                  <GitPullRequest size={13} /> Confirm &amp; create PR
                </Button>
              )}
            </div>

          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </Layout>
  );
}

// ── FileDiff ──────────────────────────────────────────────────────────────────

function FileDiff({ file, expanded, onToggle }: {
  file: FileChangeDiff;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'diff' | 'original' | 'modified'>('diff');
  const diffLines = computeDiff(file.original, file.modified);
  const addCount = diffLines.filter(l => l.type === 'add').length;

  return (
    <Card style={{ overflow: 'hidden' }}>
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
        {expanded
          ? <ChevronDown size={13} color="var(--text-secondary)" />
          : <ChevronRight size={13} color="var(--text-secondary)" />}
        <code style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)', flex: 1 }}>
          {file.path}
        </code>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginRight: 8 }}>{file.description}</span>
        <Badge variant="green">+{addCount}</Badge>
      </div>

      {expanded && (
        <>
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

          <div style={{ maxHeight: 320, overflow: 'auto', background: 'var(--bg-sunken)' }}>
            {activeTab === 'diff' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7 }}>
                <tbody>
                  {diffLines.map((line, i) => (
                    <tr
                      key={i}
                      style={{
                        background:
                          line.type === 'add' ? 'rgba(34,197,94,0.08)' :
                          line.type === 'remove' ? 'rgba(239,68,68,0.08)' :
                          'transparent',
                      }}
                    >
                      <td style={{
                        width: 20,
                        paddingLeft: 12,
                        color:
                          line.type === 'add' ? 'var(--green)' :
                          line.type === 'remove' ? 'var(--accent)' :
                          'var(--text-tertiary)',
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
  const lcs = buildLCS(origLines, modLines);
  const result: DiffLine[] = [];
  let oi = 0, mi = 0, li = 0;

  while (oi < origLines.length || mi < modLines.length) {
    const inLCS = li < lcs.length && oi < origLines.length && mi < modLines.length
      && origLines[oi] === lcs[li] && modLines[mi] === lcs[li];

    if (inLCS) {
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
  if (a.length > 200 || b.length > 200) {
    const bSet = new Set(b);
    return a.filter(l => bSet.has(l));
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

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, ChevronDown, ChevronRight,
  Code2, GitPullRequest, AlertTriangle, ArrowLeft, Key,
} from 'lucide-react';
import { Layout, PageHeader } from '../components/layout';
import { Button, Card, Toast, Spinner, Badge } from '../components/ui';
import { api } from '../lib/api';
import type { WidgetPreviewResult, FileChangeDiff } from '../lib/api';

type Step = 'loading' | 'review' | 'injecting' | 'done' | 'error' | 'no-key';

// ── Call Anthropic API directly from the browser ──────────────────────────────
async function callClaude(apiKey: string, system: string, user: string, maxTokens = 4096): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Anthropic API error ${res.status}`);
  }
  const data = await res.json();
  return data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') ?? '';
}

const WIDGET_SYSTEM = `You are an expert frontend engineer. Generate a self-contained, production-ready chat widget in vanilla JavaScript.

The widget must:
- Float fixed in the bottom-right corner (z-index: 999999)
- Show a round chat bubble button (56px, dark background, white chat icon)
- Toggle a chat panel open/closed with a smooth slide-up animation
- Chat panel: 360px wide, 520px tall, white background, rounded corners, box shadow
- Header: "Chat with us" title + X close button
- Messages area: scrollable list, user messages right-aligned (dark bg), assistant left-aligned (light gray bg)
- Input row: text field + Send button (submit on Enter key too)
- Use Shadow DOM so it never conflicts with the host page styles
- Store conversation in a JS array in memory (no localStorage)
- Show animated typing dots while waiting for the API response
- On error show "Sorry, something went wrong. Please try again." in the chat
- Render markdown-like formatting: **bold**, newlines as <br>

API INTEGRATION:
- When sending a user message, capture the full page HTML first:
  var pageHtml = document.documentElement.outerHTML.slice(0, 200000);
- POST to API_ENDPOINT with body: JSON.stringify({ projectId: PROJECT_ID, message, pageHtml })
- When sending a confirmChangeId, do NOT include pageHtml
- Headers: { 'Content-Type': 'application/json' }
- Response JSON: { reply, domOperations?, pendingChange? }

DOM OPERATIONS (apply before showing reply):
- { op: "replace_content", selector, html } → el.innerHTML = html
- { op: "replace_attr", selector, attr, value } → el.setAttribute(attr, value)
- { op: "replace_style", selector, styles } → Object.assign(el.style, styles)
- { op: "add_class", selector, classes } → el.classList.add(...classes)
- { op: "remove_class", selector, classes } → el.classList.remove(...classes)
- { op: "insert_after", selector, html } → el.insertAdjacentHTML("afterend", html)
- { op: "remove", selector } → el.remove()
Use document.querySelector(op.selector) — not shadowRoot.

CONFIRMATION UI:
When response has pendingChange, show "✅ Create PR" and "↩️ Undo" buttons.
"✅ Create PR" → POST { projectId, message: "confirm", confirmChangeId }
"↩️ Undo" → location.reload()

CRITICAL: Return ONLY raw JavaScript — no markdown fences, no explanation.`;


export default function WidgetPreviewPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const projectId = params.get('project') ?? '';

  const [step, setStep] = useState<Step>('loading');
  const [loadingMsg, setLoadingMsg] = useState('Step 1/2 — Generating widget…');
  const [preview, setPreview] = useState<WidgetPreviewResult | null>(null);
  const [prUrl, setPrUrl] = useState('');
  const [prNumber, setPrNumber] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    if (!projectId) { setErrorMsg('No project selected.'); setStep('error'); return; }
    loadPreview();
  }, [projectId]);

  async function loadPreview() {
    setStep('loading');
    setErrorMsg('');
    try {
      setLoadingMsg('Step 1/2 — Generating widget tag…');
      const { scriptTag } = await api.snippet.generateWidget(projectId);
      setLoadingMsg('Step 2/2 — Injecting into repository files…');
      const result = await api.snippet.injectWidget(projectId, scriptTag);
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
      const files = preview.files.map(f => ({ path: f.path, content: f.modified, description: f.description }));
      const result = await api.snippet.applyPr(projectId, files);
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
        action={<Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft size={13} /> Back to projects</Button>}
      />

      <div style={{ padding: 'clamp(12px, 4vw, 24px) clamp(12px, 4vw, 32px)', flex: 1, overflow: 'auto' }}>

        {step === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80 }}>
            <Spinner size={24} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 340 }}>
              {loadingMsg}<br />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>Each step takes ~5 seconds.</span>
            </p>
          </div>
        )}

        {step === 'no-key' && (
          <Card style={{ padding: 32, textAlign: 'center', maxWidth: 440, margin: '60px auto' }}>
            <Key size={28} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Anthropic API key required</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              To generate widgets without timeout issues, we call Anthropic directly from your browser using your API key.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Button variant="ghost" onClick={() => navigate('/')}>Back</Button>
              <Button variant="primary" onClick={() => navigate('/settings')}>Add API key in Settings</Button>
            </div>
          </Card>
        )}

        {step === 'error' && (
          <Card style={{ padding: 32, textAlign: 'center', maxWidth: 480, margin: '60px auto' }}>
            <AlertTriangle size={28} color="var(--accent)" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Something went wrong</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Button variant="ghost" onClick={() => navigate('/')}>Back to projects</Button>
              {projectId && <Button variant="primary" onClick={loadPreview}>Try again</Button>}
            </div>
          </Card>
        )}

        {step === 'injecting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80 }}>
            <Spinner size={24} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Creating pull request on GitHub…</p>
          </div>
        )}

        {step === 'done' && (
          <Card style={{ padding: 40, textAlign: 'center', maxWidth: 480, margin: '60px auto' }}>
            <CheckCircle size={32} color="var(--green)" style={{ marginBottom: 16 }} />
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Pull request created!</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              PR #{prNumber} is open on GitHub. Merge it to activate the chat widget.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={prUrl} target="_blank" rel="noopener"><Button variant="primary"><GitPullRequest size={13} /> View PR #{prNumber}</Button></a>
              <Button variant="ghost" onClick={() => navigate('/')}>Back to projects</Button>
            </div>
          </Card>
        )}

        {step === 'review' && preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, width: '100%' }}>

            <Card style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <CheckCircle size={15} color="var(--green)" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                Widget generated — {preview.files.length > 0 ? `${preview.files.length} file${preview.files.length !== 1 ? 's' : ''} will be modified` : 'no template files found'}
              </span>
              <div style={{ marginLeft: 'auto' }}><Badge variant="green">Ready to apply</Badge></div>
            </Card>

            {preview.scriptTag && (
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: showWidget ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setShowWidget(!showWidget)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Code2 size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Script tag being injected</span>
                  </div>
                  {showWidget ? <ChevronDown size={13} color="var(--text-secondary)" /> : <ChevronRight size={13} color="var(--text-secondary)" />}
                </div>
                {showWidget && (
                  <pre style={{ padding: '14px 16px', background: 'var(--bg-sunken)', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.7, overflow: 'auto', margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {preview.scriptTag.slice(0, 500)}…
                  </pre>
                )}
              </Card>
            )}

            {preview.files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {preview.files.map((file) => (
                  <FileDiff key={file.path} file={file} expanded={expandedFile === file.path} onToggle={() => setExpandedFile(expandedFile === file.path ? null : file.path)} />
                ))}
              </div>
            )}

            <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', padding: '14px 0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => navigate('/')}><XCircle size={13} /> Cancel</Button>
              {preview.files.length > 0 && <Button variant="primary" onClick={handleConfirm}><GitPullRequest size={13} /> Confirm &amp; create PR</Button>}
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </Layout>
  );
}

function FileDiff({ file, expanded, onToggle }: { file: FileChangeDiff; expanded: boolean; onToggle: () => void }) {
  const [activeTab, setActiveTab] = useState<'diff' | 'original' | 'modified'>('diff');
  const diffLines = computeDiff(file.original, file.modified);

  return (
    <Card style={{ overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}>
        {expanded ? <ChevronDown size={13} color="var(--text-secondary)" /> : <ChevronRight size={13} color="var(--text-secondary)" />}
        <code style={{ fontSize: 12, fontFamily: 'monospace', flex: 1 }}>{file.path}</code>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginRight: 8 }}>{file.description}</span>
        <Badge variant="green">+{diffLines.filter(l => l.type === 'add').length}</Badge>
      </div>
      {expanded && (
        <>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            {(['diff', 'original', 'modified'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '7px 14px', fontSize: 12, color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: activeTab === tab ? '2px solid var(--text-primary)' : '2px solid transparent', fontWeight: activeTab === tab ? 500 : 400, background: 'transparent' }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ maxHeight: 320, overflow: 'auto', background: 'var(--bg-sunken)' }}>
            {activeTab === 'diff' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7 }}>
                <tbody>
                  {diffLines.map((line, i) => (
                    <tr key={i} style={{ background: line.type === 'add' ? 'rgba(34,197,94,0.08)' : line.type === 'remove' ? 'rgba(239,68,68,0.08)' : 'transparent' }}>
                      <td style={{ width: 20, paddingLeft: 12, color: line.type === 'add' ? 'var(--green)' : line.type === 'remove' ? 'var(--accent)' : 'var(--text-tertiary)', userSelect: 'none' }}>
                        {line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '}
                      </td>
                      <td style={{ padding: '0 12px 0 6px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'original' && <pre style={{ margin: 0, padding: '12px 16px', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{file.original || '(empty)'}</pre>}
            {activeTab === 'modified' && <pre style={{ margin: 0, padding: '12px 16px', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{file.modified}</pre>}
          </div>
        </>
      )}
    </Card>
  );
}

type DiffLine = { type: 'add' | 'remove' | 'context'; text: string };
function computeDiff(original: string, modified: string): DiffLine[] {
  const a = original.split('\n'), b = modified.split('\n');
  const lcs = buildLCS(a, b);
  const result: DiffLine[] = [];
  let ai = 0, bi = 0, li = 0;
  while (ai < a.length || bi < b.length) {
    const inLCS = li < lcs.length && ai < a.length && bi < b.length && a[ai] === lcs[li] && b[bi] === lcs[li];
    if (inLCS) { result.push({ type: 'context', text: a[ai] }); ai++; bi++; li++; }
    else if (bi < b.length && (li >= lcs.length || b[bi] !== lcs[li])) { result.push({ type: 'add', text: b[bi] }); bi++; }
    else { result.push({ type: 'remove', text: a[ai] }); ai++; }
  }
  return result;
}
function buildLCS(a: string[], b: string[]): string[] {
  if (a.length > 200 || b.length > 200) { const s = new Set(b); return a.filter(l => s.has(l)); }
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const lcs: string[] = []; let i = a.length, j = b.length;
  while (i > 0 && j > 0) { if (a[i-1] === b[j-1]) { lcs.unshift(a[i-1]); i--; j--; } else if (dp[i-1][j] > dp[i][j-1]) i--; else j--; }
  return lcs;
}

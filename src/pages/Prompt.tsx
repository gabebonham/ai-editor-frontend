import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, CheckCircle, XCircle, ChevronDown, ChevronRight, FileCode, Zap, AlertTriangle } from 'lucide-react';
import { Layout, PageHeader } from '../components/layout';
import { Button, Badge, Card, Empty, Toast, Spinner } from '../components/ui';
import { api } from '../lib/api';
import type { Project } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  result?: {
    changeId: string;
    summary: string;
    confidence: number;
    changes: { path: string; content: string; description: string }[];
    diff: string;
  };
  status?: 'pending' | 'applied' | 'cancelled';
  prUrl?: string;
}

export default function PromptPage() {
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.projects.list().then((list) => {
      setProjects(list);
      const pid = params.get('project');
      if (pid && list.find((p) => p.id === pid)) setSelectedProject(pid);
      else if (list.length > 0) setSelectedProject(list[0].id);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedProject || sending) return;
    const text = input.trim();
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setSending(true);

    try {
      const result = await api.prompt.send({ projectId: selectedProject, prompt: text });
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: result.summary,
        result,
        status: 'pending',
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: `Error: ${(err as Error).message}`,
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleApply = async (msg: Message) => {
    if (!msg.result || applying) return;
    setApplying(msg.id);
    try {
      const res = await api.apply.submit({
        projectId: selectedProject,
        changeId: msg.result.changeId,
        summary: msg.result.summary,
        changes: msg.result.changes,
      });
      setMessages((m) =>
        m.map((x) => x.id === msg.id ? { ...x, status: 'applied', prUrl: res.prUrl } : x)
      );
      setToast({ message: `PR #${res.prNumber} created!`, type: 'success' });
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    } finally {
      setApplying(null);
    }
  };

  const handleCancel = (id: string) => {
    setMessages((m) => m.map((x) => x.id === id ? { ...x, status: 'cancelled' } : x));
  };

  const currentProject = projects.find((p) => p.id === selectedProject);

  return (
    <Layout>
      <PageHeader
        title="Prompt"
        description="Describe what you want to change in natural language"
        action={
          projects.length > 0 ? (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 10px',
                fontSize: 13,
                color: 'var(--text-primary)',
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : null
        }
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'clamp(12px, 4vw, 24px) clamp(12px, 4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.length === 0 ? (
            <Empty
              icon={<Zap size={28} />}
              title="Ready to edit"
              description={currentProject
                ? `Working with ${currentProject.githubOwner}/${currentProject.githubRepo}. Describe a change to get started.`
                : 'Select a project above to start.'}
            />
          ) : (
            messages.map((msg) => <MessageBubble
              key={msg.id}
              msg={msg}
              applying={applying === msg.id}
              expandedDiff={expandedDiff}
              onToggleDiff={setExpandedDiff}
              onApply={handleApply}
              onCancel={handleCancel}
            />)
          )}
          {sending && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AiAvatar />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', fontSize: 13, color: 'var(--text-secondary)' }}>
                <Spinner size={13} /> Analyzing your repository...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px clamp(12px, 4vw, 32px)', background: 'var(--bg-elevated)' }}>
          <div style={{
            display: 'flex',
            gap: 10,
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 12px',
            alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder={selectedProject ? 'Describe a code change... (Enter to send)' : 'Select a project first'}
              disabled={!selectedProject || sending}
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                resize: 'none',
                fontSize: 13,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                maxHeight: 120,
                overflow: 'auto',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !selectedProject || sending}
              style={{
                width: 30,
                height: 30,
                borderRadius: 'var(--radius-md)',
                background: input.trim() && selectedProject ? 'var(--text-primary)' : 'var(--bg-elevated)',
                color: input.trim() && selectedProject ? 'var(--bg)' : 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.12s',
              }}
            >
              <Send size={13} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
            Changes are previewed before being applied — nothing is committed without your approval.
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </Layout>
  );
}

function AiAvatar() {
  return (
    <div style={{
      width: 28,
      height: 28,
      background: 'var(--text-primary)',
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
    }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 10L6 2L10 10M3.5 7.5h5" stroke="var(--bg)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function MessageBubble({ msg, applying, expandedDiff, onToggleDiff, onApply, onCancel }: {
  msg: Message;
  applying: boolean;
  expandedDiff: string | null;
  onToggleDiff: (id: string | null) => void;
  onApply: (msg: Message) => void;
  onCancel: (id: string) => void;
}) {
  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          background: 'var(--text-primary)',
          color: 'var(--bg)',
          padding: '9px 14px',
          borderRadius: 'var(--radius-lg)',
          borderBottomRightRadius: 4,
          fontSize: 13,
          maxWidth: '70%',
          lineHeight: 1.5,
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  const confidenceVariant = !msg.result ? 'default'
    : msg.result.confidence >= 0.8 ? 'green'
    : msg.result.confidence >= 0.5 ? 'amber'
    : 'red';

  const isDiffOpen = expandedDiff === msg.id;

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: '85%' }}>
      <AiAvatar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Summary */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          borderTopLeftRadius: 4,
          padding: '10px 14px',
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          {msg.text}
        </div>

        {/* Result card */}
        {msg.result && (
          <Card style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
              <Badge variant={confidenceVariant}>
                {Math.round(msg.result.confidence * 100)}% confidence
              </Badge>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {msg.result.changes.length} file{msg.result.changes.length !== 1 ? 's' : ''} to change
              </span>

              {msg.status === 'applied' && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={13} color="var(--green)" />
                  <a href={msg.prUrl} target="_blank" rel="noopener" style={{ fontSize: 12, color: 'var(--green)', textDecoration: 'underline' }}>
                    View PR
                  </a>
                </div>
              )}
              {msg.status === 'cancelled' && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <XCircle size={13} color="var(--text-tertiary)" />
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Cancelled</span>
                </div>
              )}
              {msg.result.confidence < 0.5 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                  <AlertTriangle size={12} color="var(--amber)" />
                  <span style={{ fontSize: 11, color: 'var(--amber)' }}>Review carefully</span>
                </div>
              )}
            </div>

            {/* Files */}
            <div style={{ padding: '8px 0' }}>
              {msg.result.changes.map((c) => (
                <div key={c.path} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px' }}>
                  <FileCode size={12} color="var(--text-tertiary)" />
                  <code style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{c.path}</code>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{c.description}</span>
                </div>
              ))}
            </div>

            {/* Diff toggle */}
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => onToggleDiff(isDiffOpen ? null : msg.id)}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                  textAlign: 'left',
                }}
              >
                {isDiffOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {isDiffOpen ? 'Hide' : 'Show'} diff preview
              </button>
              {isDiffOpen && (
                <pre style={{
                  padding: '12px 14px',
                  background: 'var(--bg-sunken)',
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1.7,
                  overflow: 'auto',
                  maxHeight: 240,
                  borderTop: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {msg.result.diff}
                </pre>
              )}
            </div>

            {/* Actions */}
            {msg.status === 'pending' && (
              <div style={{
                padding: '10px 14px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                background: 'var(--bg-elevated)',
              }}>
                <Button variant="ghost" size="sm" onClick={() => onCancel(msg.id)}>
                  <XCircle size={12} /> Discard
                </Button>
                <Button variant="primary" size="sm" onClick={() => onApply(msg)} loading={applying}>
                  <CheckCircle size={12} /> Apply & create PR
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

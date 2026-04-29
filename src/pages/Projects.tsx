import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Globe, Trash2, ArrowRight, GitBranch,
  FolderOpen, GitFork, Zap, CheckCircle, RotateCcw,
} from 'lucide-react';
import { Layout, PageHeader } from '../components/layout';
import { Button, Input, Badge, Card, Empty, Toast, Spinner } from '../components/ui';
import { api } from '../lib/api';
import type { Project } from '../lib/api';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ name: '', githubOwner: '', githubRepo: '', defaultBranch: 'main' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.projects.list()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.githubOwner.trim()) e.githubOwner = 'Required';
    if (!form.githubRepo.trim()) e.githubRepo = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setCreating(true);
    try {
      const project = await api.projects.create(form);
      setProjects((p) => [project, ...p]);
      setShowForm(false);
      setForm({ name: '', githubOwner: '', githubRepo: '', defaultBranch: 'main' });
      setToast({ message: 'Project created', type: 'success' });
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project?')) return;
    try {
      await api.projects.delete(id);
      setProjects((p) => p.filter((x) => x.id !== id));
      setToast({ message: 'Project deleted', type: 'success' });
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    }
  };

  const handleConnectGitHub = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = api.github.authorizeUrl(projectId);
  };

  const handleInjectWidget = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/widget-preview?project=${projectId}`);
  };

  const handleReInject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.projects.resetSnippet(projectId);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, snippetInjected: false } : p));
      navigate(`/widget-preview?project=${projectId}`);
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Projects"
        description="Connect GitHub repositories to start editing with AI"
        action={
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus size={13} /> New project
          </Button>
        }
      />

      <div style={{ padding: '24px 32px', flex: 1 }}>

        {/* Create form */}
        {showForm && (
          <Card style={{ marginBottom: 24 }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                New project
              </h2>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
                <Input
                  label="Project name"
                  placeholder="My App"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={errors.name}
                />
                <Input
                  label="Default branch"
                  placeholder="main"
                  value={form.defaultBranch}
                  onChange={(e) => setForm({ ...form, defaultBranch: e.target.value })}
                />
                <Input
                  label="GitHub owner"
                  placeholder="acme-corp or paste GitHub URL"
                  value={form.githubOwner}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    const match = val.match(/github\.com\/([^/]+)/);
                    if (match) {
                      const repoMatch = val.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?\s*$/);
                      setForm({
                        ...form,
                        githubOwner: match[1],
                        githubRepo: repoMatch ? repoMatch[2] : form.githubRepo,
                      });
                    } else {
                      setForm({ ...form, githubOwner: e.target.value });
                    }
                  }}
                  error={errors.githubOwner}
                />
                <Input
                  label="Repository"
                  placeholder="my-repo or paste GitHub URL"
                  value={form.githubRepo}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    const match = val.match(/github\.com\/[^/]+\/([^/]+?)(\.git)?\s*$/);
                    setForm({ ...form, githubRepo: match ? match[1] : e.target.value });
                  }}
                  error={errors.githubRepo}
                />
              </div>
            </div>
            {/* Card footer */}
            <div style={{
              padding: '12px 20px',
              background: '#fafafa',
              borderTop: '1px solid var(--border)',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
            }}>
              <Button variant="ghost" onClick={() => { setShowForm(false); setErrors({}); }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreate} loading={creating}>
                Create project
              </Button>
            </div>
          </Card>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <Spinner size={20} />
          </div>
        ) : projects.length === 0 ? (
          <Empty
            icon={<FolderOpen size={32} />}
            title="No projects yet"
            description="Connect a GitHub repository to start making AI-powered code changes."
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus size={13} /> New project
              </Button>
            }
          />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => navigate(`/prompt?project=${p.id}`)}
                onDelete={(e) => handleDelete(p.id, e)}
                onConnectGitHub={(e) => handleConnectGitHub(p.id, e)}
                onInjectWidget={(e) => handleInjectWidget(p.id, e)}
                onReInject={(e) => handleReInject(p.id, e)}
              />
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </Layout>
  );
}

// ── ProjectCard ───────────────────────────────────────────────────────────────

function ProjectCard({
  project: p,
  onOpen,
  onDelete,
  onConnectGitHub,
  onInjectWidget,
  onReInject,
}: {
  project: Project;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onConnectGitHub: (e: React.MouseEvent) => void;
  onInjectWidget: (e: React.MouseEvent) => void;
  onReInject: (e: React.MouseEvent) => void;
}) {
  return (
    <Card
      style={{
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      onClick={onOpen}
    >
      {/* Main content */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Icon */}
        <div style={{
          width: 38,
          height: 38,
          background: 'var(--badge-bg)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '1px solid var(--border-accent)',
        }}>
          <Globe size={16} color="var(--accent)" />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {p.name}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.githubOwner}/{p.githubRepo}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Badge variant="default">
            <GitBranch size={10} style={{ marginRight: 3 }} />
            {p.defaultBranch}
          </Badge>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {new Date(p.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={onDelete}
            title="Delete project"
            style={{
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              transition: 'color 0.1s',
              display: 'flex',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={13} />
          </button>
          <ArrowRight size={13} color="var(--text-muted)" />
        </div>
      </div>

      {/* Card footer: actions */}
      <div
        style={{
          padding: '10px 20px',
          background: '#fafafa',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="sm" onClick={onConnectGitHub} title="Authorize GitHub access">
          <GitFork size={12} /> Connect GitHub
        </Button>

        {p.snippetInjected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>
              <CheckCircle size={12} />
              Widget injected
            </div>
            <Button variant="ghost" size="sm" onClick={onReInject} title="Re-inject updated widget">
              <RotateCcw size={11} /> Re-inject
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={onInjectWidget} title="Generate and inject widget">
            <Zap size={12} /> Inject chat widget
          </Button>
        )}
      </div>
    </Card>
  );
}

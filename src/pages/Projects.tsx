import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, Trash2, ArrowRight, GitBranch, FolderOpen } from 'lucide-react';
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
          <Card style={{ marginBottom: 24, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>New project</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
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
                placeholder="acme-corp"
                value={form.githubOwner}
                onChange={(e) => setForm({ ...form, githubOwner: e.target.value })}
                error={errors.githubOwner}
              />
              <Input
                label="Repository"
                placeholder="my-repo"
                value={form.githubRepo}
                onChange={(e) => setForm({ ...form, githubRepo: e.target.value })}
                error={errors.githubRepo}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => { setShowForm(false); setErrors({}); }}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} loading={creating}>Create project</Button>
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
            action={<Button variant="primary" onClick={() => setShowForm(true)}><Plus size={13} /> New project</Button>}
          />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {projects.map((p) => (
              <Card
                key={p.id}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
                onClick={() => navigate(`/prompt?project=${p.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Globe size={16} color="var(--text-secondary)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{p.name}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.githubOwner}/{p.githubRepo}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <Badge variant="default">
                    <GitBranch size={10} style={{ marginRight: 3 }} />
                    {p.defaultBranch}
                  </Badge>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    style={{
                      padding: 4,
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-tertiary)',
                      transition: 'color 0.1s',
                      display: 'flex',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    <Trash2 size={13} />
                  </button>
                  <ArrowRight size={13} color="var(--text-tertiary)" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </Layout>
  );
}

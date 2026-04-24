import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui';

export default function GitHubCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // If the backend redirected here after a successful OAuth exchange it
    // may include ?connected=true or simply no error param.
    const error = params.get('error');
    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
      setTimeout(() => navigate('/settings'), 2000);
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      flexDirection: 'column',
      gap: 16,
    }}>
      {status === 'loading' && (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Connecting GitHub…</p>
      )}
      {status === 'success' && (
        <>
          <CheckCircle size={32} color="var(--green)" />
          <p style={{ fontSize: 14, fontWeight: 500 }}>GitHub connected!</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Redirecting to settings…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle size={32} color="var(--accent)" />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Connection failed</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            GitHub OAuth could not be completed.
          </p>
          <Button variant="ghost" onClick={() => navigate('/settings')}>Back to settings</Button>
        </>
      )}
    </div>
  );
}

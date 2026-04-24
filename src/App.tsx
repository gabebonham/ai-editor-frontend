import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { isAuthenticated } from './lib/api';
import LoginPage from './pages/Login';
import GitHubCallbackPage from './pages/GitHubCallback';
import ProjectsPage from './pages/Projects';
import PromptPage from './pages/Prompt';
import ChangesPage from './pages/Changes';
import SettingsPage from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/github/callback" element={<GitHubCallbackPage />} />
        <Route path="/" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/prompt" element={<ProtectedRoute><PromptPage /></ProtectedRoute>} />
        <Route path="/changes" element={<ProtectedRoute><ChangesPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import ProjectsPage from './pages/Projects';
import PromptPage from './pages/Prompt';
import ChangesPage from './pages/Changes';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/prompt" element={<PromptPage />} />
        <Route path="/changes" element={<ChangesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

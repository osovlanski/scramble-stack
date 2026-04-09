import { Routes, Route, Navigate } from 'react-router-dom';
import { FeedPage } from './Feed/FeedPage';
import { DigestPage } from './Digest/DigestPage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Routes>
        <Route path="/" element={<Navigate to="/news" replace />} />
        <Route path="/news" element={<FeedPage />} />
        <Route path="/news/digest" element={<DigestPage />} />
      </Routes>
    </div>
  );
}

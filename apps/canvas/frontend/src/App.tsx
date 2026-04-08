import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DiagramList from './canvas/DiagramList/DiagramList';
import CanvasBoard from './canvas/Board/CanvasBoard';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/canvas" replace />} />
        <Route path="/canvas" element={<DiagramList />} />
        <Route path="/canvas/:id" element={<CanvasBoard />} />
      </Routes>
    </BrowserRouter>
  );
}

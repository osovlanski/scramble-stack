import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './AppLayout';
import HubPage from './HubPage';
import DiagramList from './canvas/DiagramList/DiagramList';
import CanvasBoard from './canvas/Board/CanvasBoard';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HubPage />} />
          <Route path="/canvas" element={<DiagramList />} />
          <Route path="/canvas/:id" element={<CanvasBoard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

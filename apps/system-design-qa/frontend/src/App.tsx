import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LibraryPage from './Library/LibraryPage';
import QuestionPage from './Question/QuestionPage';
import SessionPage from './Session/SessionPage';
import ResultPage from './Result/ResultPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/questions/:id" element={<QuestionPage />} />
        <Route path="/sessions/:id" element={<SessionPage />} />
        <Route path="/sessions/:id/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}

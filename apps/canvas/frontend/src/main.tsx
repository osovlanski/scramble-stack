import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ensureDevAuthToken } from './services/devAuth';
import '../../../../shared/ui/tokens.css';
import './index.css';

// Mint a dev JWT before the first render so authenticated canvas routes
// don't 401 on a fresh localStorage. No-op in production builds.
ensureDevAuthToken().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

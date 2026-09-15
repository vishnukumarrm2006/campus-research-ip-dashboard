import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Use the deployed backend in production.
// In local development, VITE_API_BASE_URL can remain /api.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Redirect relative /api requests to the configured backend.
// This fixes components that use fetch('/api/...') directly.
const originalFetch = window.fetch;

window.fetch = (input, init) => {
  if (typeof input === 'string' && input.startsWith('/api')) {
    const url =
      API_BASE_URL === '/api'
        ? input
        : `${API_BASE_URL}${input.substring(4)}`;

    return originalFetch(url, init);
  }

  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

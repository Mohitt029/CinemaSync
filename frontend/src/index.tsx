// frontend/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// --- Sweep any expired JWT out of localStorage before the app boots ---
const clearExpiredToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp && Date.now() >= payload.exp * 1000;
    if (isExpired) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      // eslint-disable-next-line no-console
      console.info('[auth] Cleared expired token');
    }
  } catch {
    // malformed token — wipe everything to avoid loops
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  }
};

clearExpiredToken();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
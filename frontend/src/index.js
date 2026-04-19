import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext'; // 👈 IMPORTANTE

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider>   {/* 👈 ENVOLVE O APP */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
// frontend/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css'; // Global styles for the whole app
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // Single Router for the entire app

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <BrowserRouter>
    {' '}
    {/* The only place the app is wrapped in BrowserRouter */}
    <App />
  </BrowserRouter>,
);

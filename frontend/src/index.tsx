// frontend/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';  // Импортируем глобальные стили из src/styles/globals.css
import App from './App';  // Указываем расширение .tsx
import { BrowserRouter } from 'react-router-dom';  // Один Router на всё приложение

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <BrowserRouter>  {/* Только здесь оборачиваем в BrowserRouter */}
    <App />
  </BrowserRouter>
);
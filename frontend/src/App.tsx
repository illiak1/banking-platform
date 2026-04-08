import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/Register';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <Routes>
  <Route path="/" element={<Navigate to="/login" />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
</Routes>
  );
};

export default App;
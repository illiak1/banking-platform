import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ToastProvider } from './context/ToastContext';
import RegisterPage from './pages/Register';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProfilePage from './pages/Profile';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { analytics } from './utils/analytics';
import { inject } from '@vercel/analytics';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'registration' | 'confirmation'>('landing');
  const [userData, setUserData] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    analytics.trackPageView();
  }, [currentPage]);

  const handleNavigateToHome = () => {
    setCurrentPage('landing');
  };

  const handleNavigateToRegistration = () => {
    setCurrentPage('registration');
  };

  const handleRegistrationComplete = (data: { name: string; phone: string; email: string }) => {
    setUserData(data);
    setCurrentPage('confirmation');
  };

  return (
    <>
      {currentPage === 'landing' && <LandingPage onNavigate={handleNavigateToRegistration} onNavigateToHome={handleNavigateToHome} />}
      {currentPage === 'registration' && <RegistrationPage onComplete={handleRegistrationComplete} onNavigateToHome={handleNavigateToHome} />}
      {currentPage === 'confirmation' && <ConfirmationPage userData={userData} onNavigateToHome={handleNavigateToHome} />}
    </>
  );
}

function App() {
  useEffect(() => {
    inject();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

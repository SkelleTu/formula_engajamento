import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { analytics } from './utils/analytics';
import { inject } from '@vercel/analytics';
import { initGA, trackPageView } from './utils/googleAnalytics';

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

// Hook para rastrear mudanças de rota no Google Analytics
function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
}

function RouterWithTracking() {
  usePageTracking();

  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    // Inicializar Vercel Analytics
    inject();
    
    // Inicializar Google Analytics 4 (se configurado)
    initGA();
  }, []);

  return (
    <BrowserRouter>
      <RouterWithTracking />
    </BrowserRouter>
  );
}

export default App;

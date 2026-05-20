import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminPanel from './AdminPanel';
import PublicResults from './PublicResults';
import ParticipantPersonalResult from './ParticipantPersonalResult';
import JuriInputPage from './JuriInputPage';
import JuriFormasiPage from './JuriFormasiPage';
import Login from './Login';
import { WifiOff } from 'lucide-react';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('admin_auth') === 'true'
  );
  const [error, setError] = useState('');

  const handleLogin = (password: string) => {
    if (password === 'adminlomba') {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Kata sandi salah!');
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} error={error} title="Login Admin" />;
  }

  return <>{children}</>;
};

const JuriRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('juri_auth') === 'true'
  );
  const [error, setError] = useState('');

  const handleLogin = (password: string) => {
    if (password === 'jurilomba') {
      sessionStorage.setItem('juri_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Kata sandi salah!');
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} error={error} title="Login Juri" />;
  }

  return <>{children}</>;
};

export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4" />
          Kamu sedang offline. Data akan disimpan lokal dan disinkronkan saat terhubung kembali.
        </div>
      )}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />
          <Route path="/results" element={<PublicResults />} />
          <Route path="/cek-nilai" element={<ParticipantPersonalResult />} />
          <Route path="/juri" element={
            <JuriRoute>
              <JuriInputPage />
            </JuriRoute>
          } />
          <Route path="/juri-formasi" element={
            <JuriRoute>
              <JuriFormasiPage />
            </JuriRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}


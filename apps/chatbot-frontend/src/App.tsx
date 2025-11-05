import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ChatWidget from './components/ChatWidget';
import BiasLogsAdmin from './components/BiasLogsAdmin';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const path = window.location.pathname;

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth forms if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app">
        {showRegister ? (
          <RegisterForm
            onSwitchToLogin={() => setShowRegister(false)}
            onRegisterSuccess={() => setShowRegister(false)}
          />
        ) : (
          <LoginForm
            onSwitchToRegister={() => setShowRegister(true)}
          />
        )}
      </div>
    );
  }

  // Admin routes (protected)
  if (path === '/admin') return <AdminDashboard />;
  if (path === '/admin/bias-logs') return <BiasLogsAdmin />;

  // Main app (authenticated)
  return (
    <div className="app">
      <header className="app-header">
        <h1>Aldeia Fire Recovery Assistant</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
        </div>
      </header>

      <main className="app-main">
        <ChatWidget />
      </main>
    </div>
  );
};

export default App;

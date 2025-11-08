import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { RebuildProvider, useRebuild } from './contexts/RebuildContext';
import LandingPage from './components/LandingPage';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ChatWidget from './components/ChatWidget';
import BiasLogsAdmin from './components/BiasLogsAdmin';
import AdminDashboard from './components/AdminDashboard';
import LocationConfirmation from './components/rebuild/LocationConfirmation';
import UserPreferencesNeeds from './components/rebuild/UserPreferencesNeeds';
import UserPreferencesStyle from './components/rebuild/UserPreferencesStyle';
import RebuildInspiration from './components/rebuild/RebuildInspiration';
import DesignMatches from './components/rebuild/DesignMatches';
import SelectedDesignDetails from './components/selected-design-details';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const {
    currentStep,
    setCurrentStep,
    setPropertyData,
    setPreferencesData,
    setStyleData,
    setInspirationData,
    setSelectedDesignId,
  } = useRebuild();
  const [showRegister, setShowRegister] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
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

  // Show landing page if not authenticated and auth not requested
  if (!isAuthenticated && !showAuth && currentStep === 'landing') {
    return <LandingPage onLoginClick={() => {
      setShowAuth(true);
      setCurrentStep('location');
    }} />;
  }

  // Show auth forms if not authenticated but auth requested
  if (!isAuthenticated && showAuth) {
    return (
      <div className="app">
        {showRegister ? (
          <RegisterForm
            onSwitchToLogin={() => setShowRegister(false)}
            onRegisterSuccess={() => {
              setShowRegister(false);
              setCurrentStep('location');
            }}
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

  // Rebuild flow (can be accessed with or without auth for demo purposes)
  if (currentStep === 'location') {
    return (
      <LocationConfirmation
        onBack={() => setCurrentStep('landing')}
        onNext={(data) => {
          setPropertyData(data);
          setCurrentStep('preferences-needs');
        }}
      />
    );
  }

  if (currentStep === 'preferences-needs') {
    return (
      <UserPreferencesNeeds
        onBack={() => setCurrentStep('location')}
        onNext={(data) => {
          setPreferencesData(data);
          setCurrentStep('preferences-style');
        }}
      />
    );
  }

  if (currentStep === 'preferences-style') {
    return (
      <UserPreferencesStyle
        onBack={() => setCurrentStep('preferences-needs')}
        onNext={(data) => {
          setStyleData(data);
          setCurrentStep('matches');
        }}
        onRebuildNew={() => setCurrentStep('inspiration')}
      />
    );
  }

  if (currentStep === 'inspiration') {
    return (
      <RebuildInspiration
        onBack={() => setCurrentStep('preferences-style')}
        onNext={(data) => {
          setInspirationData(data);
          setCurrentStep('matches');
        }}
        onRebuildSame={() => setCurrentStep('preferences-style')}
      />
    );
  }

  if (currentStep === 'matches') {
    return (
      <DesignMatches
        onBack={() => setCurrentStep('inspiration')}
        onSelectDesign={(id) => {
          setSelectedDesignId(id);
          setCurrentStep('details');
        }}
        onRebuildSame={() => setCurrentStep('preferences-style')}
      />
    );
  }

  if (currentStep === 'details') {
    return (
      <SelectedDesignDetails
        onBack={() => setCurrentStep('matches')}
        onContactArchitect={() => {
          // Handle architect contact
          console.log('Contact architect');
        }}
        onSaveDesign={() => {
          // Handle save design
          console.log('Save design');
        }}
        onExploreOther={() => setCurrentStep('matches')}
      />
    );
  }

  // Main app (authenticated) - Chat interface
  if (currentStep === 'chat' || (isAuthenticated && currentStep === 'landing')) {
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
  }

  // Default to landing page
  return <LandingPage onLoginClick={() => {
    setShowAuth(true);
    setCurrentStep('location');
  }} />;
};

const App: React.FC = () => {
  return (
    <RebuildProvider>
      <AppContent />
    </RebuildProvider>
  );
};

export default App;

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StrategyProvider } from './context/StrategyContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { StrategyCatalogProvider } from './context/StrategyCatalogContext'; // Phase 1 Integration
import { api } from './services/api'; // Import api service
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Strategies from './pages/Strategies';
import Strategy from './pages/Strategy';
import Positions from './pages/Positions';
import Events from './pages/Events';

import Marketplace from './pages/Marketplace'; // Import Marketplace
import Library from './pages/Library';
import Help from './pages/Help';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import SilentRenew from './pages/SilentRenew';

const DashInner = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/library" element={<Library />} />
        <Route path="/strategy" element={<Strategy />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/events" element={<Events />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </Layout>
  );
};

const AuthGate = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-textMuted font-mono">
        AUTHENTICATING...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <StrategyCatalogProvider>
      <StrategyProvider>
        <TelemetryProvider>
          <DashInner />
        </TelemetryProvider>
      </StrategyProvider>
    </StrategyCatalogProvider>
  );
};

function App() {
  // Wake up backend on mount
  useEffect(() => {
    api.wakeUp();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/silent-renew" element={<SilentRenew />} />
          <Route path="/*" element={<AuthGate />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

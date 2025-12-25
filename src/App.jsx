import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Strategy from './pages/Strategy';
import Positions from './pages/Positions';
import Events from './pages/Events';
import WarmupOverlay from './components/WarmupOverlay';

function DashInner() {
  const { data, loading, error } = useTelemetry();

  // Handle initial loading state where data.status is not yet available
  if (loading && !data.status) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
        INITIALIZING MARKO-V4 TERMINAL...
      </div>
    );
  }

  // Handle warming up state
  if (data.status?.is_warming_up) {
    return <WarmupOverlay status={data.status} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/strategy" element={<Strategy />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/events" element={<Events />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <TelemetryProvider>
        <DashInner />
      </TelemetryProvider>
    </BrowserRouter>
  );
}

export default App;

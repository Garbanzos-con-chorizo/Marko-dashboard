import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StrategyProvider } from './context/StrategyContext';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { api } from './services/api'; // Import api service
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Strategies from './pages/Strategies';
import Strategy from './pages/Strategy';
import Positions from './pages/Positions';
import Events from './pages/Events';

const DashInner = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/strategies" element={<Strategies />} />
        <Route path="/strategy" element={<Strategy />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/events" element={<Events />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  // Wake up backend on mount
  useEffect(() => {
    api.wakeUp();
  }, []);

  return (
    <BrowserRouter>
      <StrategyProvider>
        <TelemetryProvider>
          <DashInner />
        </TelemetryProvider>
      </StrategyProvider>
    </BrowserRouter>
  );
}

export default App;

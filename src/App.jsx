import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StrategyProvider } from './context/StrategyContext';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { api } from './services/api'; // Import api service
import Layout from './components/Layout';
// ... existing imports ...

// ... DashInner ...

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

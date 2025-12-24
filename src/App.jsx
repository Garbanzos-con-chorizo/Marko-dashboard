import React, { useState } from 'react';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Strategy from './pages/Strategy';
import Positions from './pages/Positions';
import Events from './pages/Events';
import WarmupOverlay from './components/WarmupOverlay';

function DashInner() {
  const [currentPage, setCurrentPage] = useState('overview');
  const { data } = useTelemetry();

  if (data.status?.is_warming_up) {
    return <WarmupOverlay status={data.status} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <Overview />;
      case 'strategy': return <Strategy />;
      case 'positions': return <Positions />;
      case 'events': return <Events />;
      default: return <Overview />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <TelemetryProvider>
      <DashInner />
    </TelemetryProvider>
  );
}

export default App;

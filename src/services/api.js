const MOCK_DELAY = 500;
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const MOCK_START_TIME = Date.now();
const MOCK_WARMUP_DURATION = 8000; // 8 seconds

// Mock Data Generators
const generateStatus = () => {
  const elapsed = Date.now() - MOCK_START_TIME;
  const isWarmingUp = elapsed < MOCK_WARMUP_DURATION;
  const progress = Math.min((elapsed / MOCK_WARMUP_DURATION), 1.0); // 0.0 to 1.0

  return {
    status: isWarmingUp ? 'WARMUP' : 'RUNNING',
    is_warming_up: isWarmingUp,
    warmup_progress: progress,
    warmup_remaining_est: Math.max(0, (MOCK_WARMUP_DURATION - elapsed) / 1000),
    heartbeat: new Date().toISOString(),
    equity: 124500.00 + (Math.random() * 100 - 50),
    unrealizedPnL: 350.50 + (Math.random() * 20 - 10),
    openPositionsCount: isWarmingUp ? 0 : 3,
    lastAction: isWarmingUp ? 'SYNCING_HISTORY' : 'REBALANCE',
  };
};

const generateStrategy = () => ({
  state: 'VOLATILITY_EXPANSION',
  conviction: 0.85,
  riskMultiplier: 1.2,
  filters: {
    trend: true,
    volatility: true,
    sentiment: false,
  },
  lastDecisionReason: 'VIX spike detected, increasing position size.',
});

const generatePositions = () => [
  { symbol: 'BTC-USD', size: 0.5, avgPrice: 65000, unrealizedPnL: 1200 },
  { symbol: 'ETH-USD', size: 10, avgPrice: 3500, unrealizedPnL: -200 },
  { symbol: 'SOL-USD', size: 150, avgPrice: 145, unrealizedPnL: 50 },
];

const generateEvents = () => [
  { timestamp: new Date().toISOString(), type: 'INFO', message: 'Heartbeat received' },
  { timestamp: new Date(Date.now() - 5000).toISOString(), type: 'WARN', message: 'High latency detected on exchange' },
  { timestamp: new Date(Date.now() - 15000).toISOString(), type: 'INFO', message: 'Strategy state updated to VOLATILITY_EXPANSION' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function fetchEndpoint(endpoint) {
  if (IS_MOCK) {
    await sleep(MOCK_DELAY);
    switch (endpoint) {
      case '/api/v1/status': return generateStatus();
      case '/api/v1/strategy': return generateStrategy();
      case '/api/v1/positions': return generatePositions();
      case '/api/v1/events': return generateEvents();
      default: throw new Error('404 Not Found');
    }
  }

  // Use absolute URL if base is provided, otherwise relative
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
}

export const api = {
  getStatus: () => fetchEndpoint('/api/v1/status'),
  getStrategy: () => fetchEndpoint('/api/v1/strategy'),
  getPositions: () => fetchEndpoint('/api/v1/positions'),
  getEvents: () => fetchEndpoint('/api/v1/events'),
};

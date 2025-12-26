const MOCK_DELAY = 500;
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const MOCK_START_TIME = Date.now();
const MOCK_WARMUP_DURATION = 8000; // 8 seconds

// Mock telemetry generator matching backend structure
const generateTelemetry = () => {
  const elapsed = Date.now() - MOCK_START_TIME;
  const isWarmingUp = elapsed < MOCK_WARMUP_DURATION;
  const progress = Math.min((elapsed / MOCK_WARMUP_DURATION), 1.0);

  return {
    timestamp: new Date().toISOString(),
    version: "1.0",
    engine: {
      status: isWarmingUp ? 'STARTING' : 'RUNNING',
      uptime_seconds: elapsed / 1000,
      last_heartbeat: new Date().toISOString(),
      last_processed_bar_timestamp: isWarmingUp ? null : Date.now(),
      last_processed_symbol: isWarmingUp ? null : 'BTC/USD',
      error_state: null,
      is_warming_up: isWarmingUp,
      warmup_progress: progress,
      warmup_remaining_seconds: isWarmingUp ? Math.max(0, (MOCK_WARMUP_DURATION - elapsed) / 1000) : null
    },
    strategy: {
      name: 'MARKO_V4',
      regime: isWarmingUp ? null : 'VOLATILITY_EXPANSION',
      phi: isWarmingUp ? null : 0.85,
      volatility: isWarmingUp ? null : 0.22,
      risk_multiplier: isWarmingUp ? null : 1.2,
      conviction_score: isWarmingUp ? null : 0.85,
      active_filters: isWarmingUp ? [] : ['trend', 'volatility'],
      last_decision: isWarmingUp ? 'WAIT' : 'REBALANCE'
    },
    portfolio: {
      total_equity: 124500.00 + (Math.random() * 100 - 50),
      cash: 50000,
      total_exposure_pct: isWarmingUp ? 0 : 0.6,
      positions: isWarmingUp ? [] : [
        { symbol: 'BTC-USD', qty: 0.5, avg_entry_price: 65000, current_price: 67400, unrealized_pnl: 1200, market_value: 33700 },
        { symbol: 'ETH-USD', qty: 10, avg_entry_price: 3500, current_price: 3480, unrealized_pnl: -200, market_value: 34800 },
        { symbol: 'SOL-USD', qty: 150, avg_entry_price: 145, current_price: 145.33, unrealized_pnl: 50, market_value: 21800 }
      ]
    },
    recent_orders: isWarmingUp ? [] : [
      { order_id: 'ord_123', client_order_id: null, symbol: 'BTC-USD', side: 'BUY', qty: 0.5, status: 'FILLED', timestamp: new Date(Date.now() - 3600000).toISOString(), price: 65000 }
    ],
    events: [
      { timestamp: new Date().toISOString(), type: 'INFO', message: isWarmingUp ? 'SYNCING_HISTORY' : 'Heartbeat received' },
      { timestamp: new Date(Date.now() - 5000).toISOString(), type: 'WARN', message: 'High latency detected on exchange' },
      { timestamp: new Date(Date.now() - 15000).toISOString(), type: 'INFO', message: 'Strategy state updated to VOLATILITY_EXPANSION' }
    ]
  };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Transform backend response to frontend format
function transformTelemetry(raw) {
  // Convert active_filters array to object format
  const filtersObj = {};
  if (raw.strategy?.active_filters) {
    raw.strategy.active_filters.forEach(filter => {
      filtersObj[filter] = true;
    });
  }

  return {
    status: {
      status: raw.engine?.status || 'UNKNOWN',
      is_warming_up: raw.engine?.is_warming_up || false,
      warmup_progress: raw.engine?.warmup_progress || 0,
      warmup_remaining_est: raw.engine?.warmup_remaining_seconds || 0,
      heartbeat: raw.engine?.last_heartbeat,
      equity: raw.portfolio?.total_equity || 0,
      unrealizedPnL: raw.portfolio?.positions?.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0) || 0,
      openPositionsCount: raw.portfolio?.positions?.length || 0,
      lastAction: raw.strategy?.last_decision || 'WAIT'
    },
    strategy: {
      regime: raw.strategy?.regime || raw.strategy?.markov_state || 'UNKNOWN',
      phi: raw.strategy?.phi ?? null,
      volatility: raw.strategy?.volatility ?? null,
      conviction_score: raw.strategy?.conviction_score ?? 0,
      risk_multiplier: raw.strategy?.risk_multiplier ?? 1,
      filters: filtersObj,
      last_decision: raw.strategy?.last_decision || 'No recent decision'
    },
    positions: (raw.portfolio?.positions || []).map(pos => ({
      symbol: pos.symbol,
      size: pos.qty,
      avgPrice: pos.avg_entry_price,
      unrealizedPnL: pos.unrealized_pnl,
      currentPrice: pos.current_price,
      marketValue: pos.market_value
    })),
    events: raw.events || []
  };
}

async function fetchTelemetry() {
  if (IS_MOCK) {
    await sleep(MOCK_DELAY);
    return transformTelemetry(generateTelemetry());
  }

  const url = `${API_BASE_URL}/api/v1/telemetry`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const raw = await response.json();
    return transformTelemetry(raw);
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
}

// Mock chart data generator matching /api/chart contract
const generateChartData = () => {
  const now = Date.now();
  const bars = [];
  const entries = [];
  const exits = [];

  // Generate 100 bars (candlesticks) with realistic price movement
  let basePrice = 67000;
  for (let i = 99; i >= 0; i--) {
    const ts = now - (i * 60000); // 1-minute bars
    const volatility = Math.random() * 200;
    const open = basePrice;
    const close = basePrice + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * 100;
    const low = Math.min(open, close) - Math.random() * 100;
    const volume = Math.random() * 10 + 5;

    bars.push({ ts, open, high, low, close, volume });
    basePrice = close;

    // Add some random entries
    if (i === 70) {
      entries.push({ ts, price: open, side: 'LONG', size: 0.5 });
    }
    if (i === 40) {
      exits.push({ ts, price: close });
    }
    if (i === 30) {
      entries.push({ ts, price: open, side: 'SHORT', size: 0.3 });
    }
  }

  return {
    symbol: 'BTC/USD',
    timeframe: '1m',
    bars,
    overlays: {
      entries,
      exits,
      current_position: {
        side: 'SHORT',
        entry_price: entries[entries.length - 1]?.price || null,
        size: 0.3
      }
    }
  };
};

async function fetchChartData() {
  if (IS_MOCK) {
    await sleep(MOCK_DELAY);
    return generateChartData();
  }

  const url = `${API_BASE_URL}/api/chart`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    // Defensive validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid chart data structure');
    }

    // Ensure arrays exist
    if (!Array.isArray(data.bars)) {
      data.bars = [];
    }
    if (!data.overlays || typeof data.overlays !== 'object') {
      data.overlays = { entries: [], exits: [], current_position: { side: 'FLAT', entry_price: null, size: null } };
    }
    if (!Array.isArray(data.overlays.entries)) {
      data.overlays.entries = [];
    }
    if (!Array.isArray(data.overlays.exits)) {
      data.overlays.exits = [];
    }

    return data;
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
}

export const api = {
  getTelemetry: fetchTelemetry,
  getChartData: fetchChartData
};

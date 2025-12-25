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
      markov_state: isWarmingUp ? null : 'VOLATILITY_EXPANSION',
      conviction_score: isWarmingUp ? 0 : 0.85,
      risk_multiplier: isWarmingUp ? 1 : 1.2,
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
      state: raw.strategy?.markov_state || 'UNKNOWN',
      conviction: raw.strategy?.conviction_score || 0,
      riskMultiplier: raw.strategy?.risk_multiplier || 1,
      filters: filtersObj,
      lastDecisionReason: raw.strategy?.last_decision || 'No recent decision'
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

export const api = {
  getTelemetry: fetchTelemetry
};

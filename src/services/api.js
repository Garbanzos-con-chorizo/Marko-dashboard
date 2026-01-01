const MOCK_DELAY = 500;
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const MOCK_START_TIME = Date.now();
const MOCK_WARMUP_DURATION = 8000; // 8 seconds

// --- Mock Data Generators ---

const generateStrategyList = () => {
  return [
    {
      id: "Trend_BTC_1h",
      symbol: "BTC/USD",
      timeframe: "1h",
      status: "RUNNING",
      active_pnl: 1250.50,
      params: { window: 20, multiplier: 2.0 }
    },
    {
      id: "MeanRev_ETH_15m",
      symbol: "ETH/USD",
      timeframe: "15m",
      status: "RUNNING",
      active_pnl: -320.10,
      params: { rsi_period: 14, overbought: 70 }
    },
    {
      id: "Arb_SOL_5m",
      symbol: "SOL/USD",
      timeframe: "5m",
      status: "STOPPED",
      active_pnl: 45.00,
      params: { spread_threshold: 0.5 }
    }
  ];
};

// Mock telemetry generator matching backend structure
const generateTelemetry = (strategyId = 'legacy') => {
  const elapsed = Date.now() - MOCK_START_TIME;
  const isWarmingUp = elapsed < MOCK_WARMUP_DURATION;
  const progress = Math.min((elapsed / MOCK_WARMUP_DURATION), 1.0);

  // Vary data based on strategyId if needed for realism
  const isEth = strategyId.includes('ETH');
  const symbol = isEth ? 'ETH-USD' : 'BTC-USD';
  const price = isEth ? 3500 : 67400;

  return {
    timestamp: new Date().toISOString(),
    version: "2.0",
    instance_id: strategyId,
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
    // Strategy matches StrategyState schema
    strategy: {
      name: strategyId === 'legacy' ? 'MARKO_V4' : strategyId,
      markov_state: isWarmingUp ? null : 'VOLATILITY_EXPANSION', // "regime" in V1, "markov_state" in V2/Shared
      phi: isWarmingUp ? null : 0.85,
      volatility: isWarmingUp ? null : 0.22,
      risk_multiplier: isWarmingUp ? null : 1.2,
      conviction_score: isWarmingUp ? null : 0.85,
      active_filters: isWarmingUp ? [] : ['trend', 'volatility'],
      last_decision: isWarmingUp ? 'WAIT' : 'REBALANCE'
    },
    // PortfolioSnapshot
    portfolio: {
      total_equity: 124500.00 + (Math.random() * 100 - 50),
      cash: 50000,
      total_exposure_pct: isWarmingUp ? 0 : 0.6,
      positions: isWarmingUp ? [] : [
        { symbol: symbol, qty: isEth ? 10 : 0.5, avg_entry_price: price * 0.98, current_price: price, unrealized_pnl: 1000, market_value: 30000 },
      ]
    },
    recent_orders: isWarmingUp ? [] : [
      { order_id: 'ord_123', client_order_id: null, symbol: symbol, side: 'BUY', qty: 0.5, status: 'FILLED', timestamp: new Date(Date.now() - 3600000).toISOString(), price: price * 0.98 }
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
  // Detect if raw is the full snapshot OR just the flattened StrategyState (V2 ambiguous case)
  // If 'markov_state' is at root, treat as flat StrategyState
  let strategyData = raw.strategy;
  let engineData = raw.engine;
  let portfolioData = raw.portfolio;

  if (!strategyData && raw.markov_state) {
    // V2 Flat Response Detected
    strategyData = raw;
    // Engine/Portfolio are missing in flat response, so we default them or leave them empty.
    // This allows the Strategy Detail view to work partially even if full snapshot isn't sent.
    engineData = { status: 'UNKNOWN' }; // Fallback
    portfolioData = { total_equity: 0, positions: [] }; // Fallback
  }

  // Convert active_filters array to object format
  const filtersObj = {};
  if (strategyData?.active_filters && Array.isArray(strategyData.active_filters)) {
    strategyData.active_filters.forEach(filter => {
      filtersObj[filter] = true;
    });
  }

  return {
    status: {
      status: engineData?.status || 'UNKNOWN',
      is_warming_up: engineData?.is_warming_up || false,
      warmup_progress: engineData?.warmup_progress || 0,
      warmup_remaining_est: engineData?.warmup_remaining_seconds || 0,
      heartbeat: engineData?.last_heartbeat,
      equity: portfolioData?.total_equity || 0,
      unrealizedPnL: portfolioData?.positions?.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0) || 0,
      openPositionsCount: portfolioData?.positions?.length || 0,
      lastAction: strategyData?.last_decision || 'WAIT',
      instanceId: raw.instance_id // Capture V2 instance ID
    },
    strategy: {
      name: strategyData?.name || 'Unknown Strategy',
      regime: strategyData?.markov_state || strategyData?.regime || 'UNKNOWN', // Prioritize markov_state
      phi: strategyData?.phi ?? null,
      volatility: strategyData?.volatility ?? null,
      conviction_score: strategyData?.conviction_score ?? 0,
      risk_multiplier: strategyData?.risk_multiplier ?? 1,
      filters: filtersObj,
      last_decision: strategyData?.last_decision || 'No recent decision'
    },
    positions: (portfolioData?.positions || []).map(pos => ({
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

async function fetchTelemetry(strategyId = null) {
  if (IS_MOCK) {
    await sleep(MOCK_DELAY);
    return transformTelemetry(generateTelemetry(strategyId || 'legacy'));
  }

  // Route to V2 if ID is provided, else V1
  const url = strategyId
    ? `${API_BASE_URL}/api/v2/strategies/${strategyId}/telemetry`
    : `${API_BASE_URL}/api/v1/telemetry`;

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

// Mock chart data generator matching /api/chart (and V2) contract
const generateChartData = (strategyId = 'legacy') => {
  const now = Date.now();
  const bars = [];
  const entries = [];
  const exits = [];

  // V2: Customize chart based on strategy
  const isEth = strategyId.includes('ETH');
  const isSol = strategyId.includes('SOL');
  let basePrice = isEth ? 3500 : (isSol ? 145 : 67000);
  const symbol = isEth ? 'ETH/USD' : (isSol ? 'SOL/USD' : 'BTC/USD');

  // Generate 100 bars (candlesticks) with realistic price movement
  for (let i = 99; i >= 0; i--) {
    const ts = now - (i * 3600000); // 1-hour bars
    const volatility = basePrice * 0.005; // 0.5% volatility
    const open = basePrice;
    const close = basePrice + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
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
    symbol: symbol,
    timeframe: '1h', // Could vary this based on ID parsing
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

async function fetchChartData(strategyId = null) {
  if (IS_MOCK) {
    await sleep(MOCK_DELAY);
    return generateChartData(strategyId || 'legacy');
  }

  // Route to V2 if ID is provided, else V1
  const url = strategyId
    ? `${API_BASE_URL}/api/v2/strategies/${strategyId}/chart`
    : `${API_BASE_URL}/api/chart`;

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

// --- New V2 Methods ---

async function fetchStrategies() {
  if (IS_MOCK) {
    await sleep(MOCK_DELAY);
    return generateStrategyList();
  }

  const url = `${API_BASE_URL}/api/v2/strategies`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
}

async function controlStrategy(id, action) {
  if (IS_MOCK) {
    await sleep(MOCK_DELAY);
    console.log(`[MOCK] Control strategy ${id} action: ${action}`);
    return { success: true, message: `Strategy ${id} ${action}ed` };
  }

  const url = `${API_BASE_URL}/api/v2/strategies/${id}/control`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (!response.ok) {
      throw new Error(`Control Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Control failed for ${id}:`, error);
    throw error;
  }
}

export const api = {
  getTelemetry: fetchTelemetry,
  getChartData: fetchChartData,
  getStrategies: fetchStrategies,
  controlStrategy: controlStrategy
};

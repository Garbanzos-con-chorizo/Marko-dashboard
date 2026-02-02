import { getAuthHeaders } from './auth';

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
  // Mock PnL for pocket
  const mockPocketPnL = isWarmingUp ? 0 : (isEth ? -320.10 : 1250.50);

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
      markov_state: isWarmingUp ? null : 'VOLATILITY_EXPANSION',
      phi: isWarmingUp ? null : 0.85,
      volatility: isWarmingUp ? null : 0.22,
      risk_multiplier: isWarmingUp ? null : 1.2,
      conviction_score: isWarmingUp ? null : 0.85,
      active_filters: isWarmingUp ? [] : ['trend', 'volatility'],
      last_decision: isWarmingUp ? 'WAIT' : 'REBALANCE',
      pocket_pnl: mockPocketPnL, // NEW: Pocket PnL
      broker_type: 'PAPER'       // NEW: Execution Mode
    },
    // PortfolioSnapshot
    portfolio: {
      total_equity: 124500.00 + (Math.random() * 100 - 50),
      cash: 50000,
      total_exposure_pct: isWarmingUp ? 0 : 0.6,
      positions: isWarmingUp ? [] : [
        { symbol: symbol, qty: isEth ? 10 : 0.5, avg_entry_price: price * 0.98, current_price: price, unrealized_pnl: 1000, market_value: 30000 },
      ],
      // NEW: Pockets Breakdown
      pockets: [
        {
          pocket_id: strategyId,
          equity: 10000 + mockPocketPnL,
          unrealized_pnl: mockPocketPnL, // Simplified for mock
          positions: [] // In real app, this would be populated
        },
        {
          pocket_id: 'HODL_Strategy',
          equity: 55000,
          unrealized_pnl: 12000,
          positions: []
        }
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
  // V2 API returns instance-specific telemetry with these possible structures:
  // 1. Full snapshot: { engine: {...}, strategy: {...}, portfolio: {...}, events: [...] }
  // 2. Flat StrategyState: { markov_state, phi, volatility, ... } (just the logical fields)

  let strategyData = raw.strategy;
  let engineData = raw.engine;
  let portfolioData = raw.portfolio;
  const pockets = portfolioData?.pockets || [];
  const pocketUnrealized = pockets.reduce((sum, p) => sum + Number(p.unrealized_pnl || 0), 0);
  const pocketRealized = pockets.reduce((sum, p) => sum + Number(p.realized_pnl || 0), 0);
  const totalPocketPnl = pocketUnrealized + pocketRealized;

  // Detect V2 flat response (just strategy state fields at root level)
  if (!strategyData && (raw.markov_state !== undefined || raw.phi !== undefined)) {
    strategyData = raw;
    // For flat responses, engine/portfolio might be missing - use sensible defaults
    engineData = engineData || { status: 'RUNNING' };
    portfolioData = portfolioData || { total_equity: 0, positions: [] };
  }

  // Convert active_filters from array to object for easier UI rendering
  const filtersObj = {};
  if (strategyData?.active_filters && Array.isArray(strategyData.active_filters)) {
    strategyData.active_filters.forEach(filter => {
      filtersObj[filter] = true;
    });
  }

  // Normalize status logic:
  let engineStatus = (engineData?.status || 'UNKNOWN').toUpperCase();
  const isWarmingUp = engineData?.is_warming_up || false;

  if (engineStatus === 'STARTING' && !isWarmingUp) {
    engineStatus = 'RUNNING';
  }

  return {
    status: {
      status: engineStatus,
      is_warming_up: isWarmingUp,
      warmup_progress: engineData?.warmup_progress || 0,
      warmup_remaining_est: engineData?.warmup_remaining_seconds || 0,
      heartbeat: engineData?.last_heartbeat,
      equity: portfolioData?.total_equity || 0,
      cash: portfolioData?.cash ?? 0,
      exposurePct: portfolioData?.total_exposure_pct ?? 0,
      unrealizedPnL: pockets.length ? totalPocketPnl : (portfolioData?.positions?.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0) || 0),
      openPositionsCount: portfolioData?.positions?.length || 0,
      lastAction: strategyData?.last_decision || 'WAIT',
      instanceId: raw.instance_id || raw.id // Capture V2 instance ID
    },
    strategy: {
      name: strategyData?.name || raw.id || 'Unknown Strategy',
      // V2 Multi-Strategy: These fields are now instance-specific
      markov_state: strategyData?.markov_state || strategyData?.regime || 'UNKNOWN',
      regime: strategyData?.markov_state || strategyData?.regime || 'UNKNOWN',
      phi: strategyData?.phi ?? null,
      volatility: strategyData?.volatility ?? null,
      conviction_score: strategyData?.conviction_score ?? null,
      risk_multiplier: strategyData?.risk_multiplier ?? null,
      active_filters: strategyData?.active_filters || [],
      filters: filtersObj,
      last_decision: strategyData?.last_decision || 'No recent decision',
      // NEW: Pocket PnL and Metadata
      pocket_pnl: strategyData?.pocket_pnl ?? null,
      broker_type: strategyData?.broker_type || 'PAPER'
    },
    telemetry_schema: raw.telemetry_schema || null,
    portfolio: portfolioData || {},
    positions: (portfolioData?.positions || []).map(pos => ({
      symbol: pos.symbol,
      size: pos.qty,
      avgPrice: pos.avg_entry_price,
      unrealizedPnL: pos.unrealized_pnl,
      currentPrice: pos.current_price,
      marketValue: pos.market_value
    })),
    // NEW: Pockets (Strategy Breakdown)
    pockets,
    events: raw.events || []
  };
}

async function fetchTelemetry(strategyId = null) {
  if (IS_MOCK) {
    await sleep(MOCK_DELAY);
    return transformTelemetry(generateTelemetry(strategyId || 'legacy'));
  }

  // Route to V2 if ID is provided AND valid, else V1 (Legacy_Primary maps to V1)
  const isLegacy = !strategyId || strategyId === 'Legacy_Primary';
  const url = !isLegacy
    ? `${API_BASE_URL}/api/v2/strategies/${strategyId}/telemetry`
    : `${API_BASE_URL}/api/v1/telemetry`;

  try {
    const response = await fetch(url, { headers: { ...getAuthHeaders() } });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const raw = await response.json();
    // Inject instance ID if missing (for legacy)
    if (isLegacy && !raw.instance_id) {
      raw.instance_id = 'Legacy_Primary';
    }
    return transformTelemetry(raw);
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
}

// Mock chart data generator matching /api/chart (and V2) contract
const generateChartData = (strategyId = 'legacy', limit = 100) => {
  const now = Date.now();
  const bars = [];
  const entries = [];
  const exits = [];

  // V2: Customize chart based on strategy
  const isEth = strategyId.includes('ETH');
  const isSol = strategyId.includes('SOL');
  let basePrice = isEth ? 3500 : (isSol ? 145 : 67000);
  const symbol = isEth ? 'ETH/USD' : (isSol ? 'SOL/USD' : 'BTC/USD');

  // Generate N bars (candlesticks) with realistic price movement
  for (let i = limit - 1; i >= 0; i--) {
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
    if (i === 70 && limit >= 70) {
      entries.push({ ts, price: open, side: 'LONG', size: 0.5 });
    }
    if (i === 40 && limit >= 40) {
      exits.push({ ts, price: close });
    }
    if (i === 30 && limit >= 30) {
      entries.push({ ts, price: open, side: 'SHORT', size: 0.3 });
    }
  }

  return {
    symbol: symbol,
    timeframe: '1h', // Could vary this based on ID parsing
    available_symbols: [symbol],
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

async function fetchChartData(strategyId = null, limit = 100, symbol = null) {
  if (IS_MOCK) {
    await sleep(MOCK_DELAY);
    return generateChartData(strategyId || 'legacy', limit);
  }

  // Route to V2 if ID is provided AND valid, else V1 (Legacy_Primary maps to V1)
  const isLegacy = !strategyId || strategyId === 'Legacy_Primary';
  let url = !isLegacy
    ? `${API_BASE_URL}/api/v2/strategies/${strategyId}/chart`
    : `${API_BASE_URL}/api/chart`;

  // Append query params
  const params = new URLSearchParams();
  params.append('limit', limit);
  if (symbol) {
    params.append('symbol', symbol);
  }
  url += `?${params.toString()}`;

  try {
    const response = await fetch(url, { headers: { ...getAuthHeaders() } });
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

  // Reverted to /api/v2/strategies because /admin/instances returned 405 Method Not Allowed
  const url = `${API_BASE_URL}/api/v2/strategies`;
  try {
    const response = await fetch(url, { headers: { ...getAuthHeaders() } });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    // Robust handling for various response formats
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.strategies)) return data.strategies;
    if (data && Array.isArray(data.instances)) return data.instances;

    console.warn("Unexpected strategies format:", data);
    return [];
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    // Don't throw, return empty so UI doesn't crash
    return [];
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
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

async function wakeUp() {
  if (IS_MOCK) return true;
  try {
    console.log("Creating wake-up signal...");
    // Use no-cors to blindly fire a packet to wake up server
    // (GET / usually returns 200 or 404, both wake it up)
    await fetch(`${API_BASE_URL}/`, { method: 'GET', mode: 'no-cors' });
    return true;
  } catch (e) {
    // Network error probably means it's down or DNS issue, 
    // but the attempt itself might have triggered the wake up.
    console.warn("Wake-up signal attempt:", e);
    return false;
  }
}


// Mock Events Generator with filtering
const generateMockLogs = (params) => {
  const { limit = 50, offset = 0, level, instance_id } = params;
  const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const instances = ['Trend_BTC_1h', 'MeanRev_ETH_15m', 'Arb_SOL_5m', 'BTC_BOT_1'];
  const modules = ['ENGINE', 'STRATEGY', 'RISK', 'EXCHANGE'];

  const allLogs = [];
  const TOTAL_MOCK_LOGS = 150;

  // Generate a deterministic set of logs
  for (let i = 0; i < TOTAL_MOCK_LOGS; i++) {
    const timestamp = new Date(Date.now() - i * 60000).toISOString();
    // Cyclical distribution
    const lvl = levels[i % levels.length];
    const inst = instances[i % instances.length];

    allLogs.push({
      timestamp,
      level: lvl,
      message: `System event log #${i} - ${lvl} occurred in process.`,
      module: modules[i % modules.length],
      instance_id: inst
    });
  }

  // Filter
  let filtered = allLogs;
  if (level) {
    filtered = filtered.filter(l => l.level === level);
  }
  if (instance_id) {
    filtered = filtered.filter(l => l.instance_id === instance_id);
  }

  // Paginate
  const sliced = filtered.slice(offset, offset + limit);

  return {
    total: filtered.length,
    limit,
    offset,
    logs: sliced
  };
};

async function fetchSystemLogs(params = {}) {
  // Params: limit, offset, level, instance_id
  if (IS_MOCK) {
    await sleep(MOCK_DELAY);
    return generateMockLogs(params);
  }

  const query = new URLSearchParams();
  if (params.limit) query.append('limit', params.limit);
  if (params.offset) query.append('offset', params.offset);
  if (params.level) query.append('level', params.level);
  if (params.instance_id) query.append('instance_id', params.instance_id);

  const url = `${API_BASE_URL}/api/v1/events?${query.toString()}`;

  try {
    const response = await fetch(url, { headers: { ...getAuthHeaders() } });
    if (!response.ok) {
      // Fallback for V1 legacy if V1 events endpoint doesn't support filtering yet?
      // Assuming backend spec is implemented.
      throw new Error(`Logs API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch logs failed:`, error);
    // return empty structure on fail
    return { total: 0, limit: params.limit || 50, offset: params.offset || 0, logs: [] };
  }
}

export const api = {
  getTelemetry: fetchTelemetry,
  getChartData: fetchChartData,
  getStrategies: fetchStrategies,
  controlStrategy: controlStrategy,
  getSystemLogs: fetchSystemLogs,
  wakeUp: wakeUp
};

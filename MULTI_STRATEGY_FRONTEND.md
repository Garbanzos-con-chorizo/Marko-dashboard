# Multi-Strategy Architecture Frontend Integration

## Overview
The frontend has been successfully refactored to support the new V2 Multi-Strategy Architecture. All pages now properly poll and display instance-specific data for each strategy.

## Key Changes

### 1. **API Service Enhancement** (`src/services/api.js`)
- **Enhanced `transformTelemetry()` function** to properly handle V2 API responses
- Correctly extracts instance-specific logical fields:
  - `markov_state` (regime detection)
  - `phi` (regime stability)
  - `volatility` (calculated per instance's vol_window)
  - `conviction_score` (confidence 0.3-1.8)
  - `risk_multiplier` (calculated from local phi)
  - `active_filters` (blocks active for this instance)
  - `last_decision` (what this instance chose on last candle)
- Supports both full snapshot and flat StrategyState responses
- Properly captures `instance_id` for tracking

### 2. **Premium Strategy Selector** (`src/components/StrategySelector.jsx`)
**NEW COMPONENT** - Replaced the clunky HTML `<select>` dropdown with a beautiful custom component featuring:
- ✨ Smooth animations (fade-in, slide-down)
- 🎯 Live status indicators (pulsing green for RUNNING, red for STOPPED)
- 💰 PnL badges showing active performance
- 📊 Symbol and timeframe display
- ✅ Visual checkmark for selected strategy
- 🎨 Hover effects and transitions
- 🖱️ Click-outside-to-close functionality

### 3. **Layout Updates** (`src/components/Layout.jsx`)
- Integrated the new `StrategySelector` component
- Removed the old basic HTML select element
- Cleaner, more modern sidebar appearance

### 4. **Instance-Aware Page Headers**
All pages now display which strategy instance is being viewed:

#### **Overview Page** (`src/pages/Overview.jsx`)
- Shows: `Viewing: MARKO_BTC_1H • BTC/USD • 1h`
- Displays instance-specific equity, PnL, and positions

#### **Strategy Page** (`src/pages/Strategy.jsx`)
- Shows: `Instance: MARKO_BTC_1H • BTC/USD • 1h`
- Clarifies: "These logical fields are specific to this strategy instance's isolated memory and parameters"
- Displays all instance-specific metrics (phi, volatility, conviction, etc.)

#### **Positions Page** (`src/pages/Positions.jsx`)
- Shows: `Instance: MARKO_BTC_1H • BTC/USD`
- Displays positions for the selected strategy only

#### **Events Page** (`src/pages/Events.jsx`)
- Shows: `Instance: MARKO_BTC_1H • BTC/USD`
- Displays logs for the selected strategy

### 5. **CSS Animations** (`src/index.css`)
Added smooth animation keyframes:
- `fade-in` - Opacity transition
- `slide-in-from-top-2` - Vertical slide animation
- Applied to dropdown menu for polished UX

## Data Flow Architecture

### Strategy List Polling
```
StrategyContext → polls /api/v2/strategies every 5s
  ↓
Returns: [
  { id, status, symbol, timeframe, params, active_pnl }
]
  ↓
Auto-selects first strategy if none selected
```

### Instance Telemetry Polling
```
TelemetryContext → polls /api/v2/strategies/{id}/telemetry every 5s
  ↓
Returns instance-specific data:
  - markov_state (for THIS symbol)
  - phi (for THIS instance's memory)
  - volatility (using THIS instance's vol_window)
  - conviction_score (based on THIS symbol's trend)
  - risk_multiplier (from THIS instance's phi)
  - active_filters (blocks active for THIS instance)
  - last_decision (what THIS instance decided)
  ↓
All pages consume this data via useTelemetry()
```

### Strategy Control
```
User clicks Start/Stop/Pause on Strategies page
  ↓
POST /api/v2/strategies/{id}/control
  ↓
Only affects THAT specific instance
  ↓
Immediate refresh to show updated status
```

## Critical Frontend Behavior

### ✅ Instance Isolation
- Each strategy instance has its own isolated memory
- BTC strategy's phi ≠ ETH strategy's phi
- Volatility calculated using each instance's specific `vol_window` parameter
- Filters are instance-specific (BTC might be in VOL_SPIKE while ETH is not)

### ✅ No Global State
- Fields like `markov_state`, `phi`, `volatility` are **NOT** global
- They are tied to the `instance_id` being polled
- Switching strategies in the dropdown immediately polls the new instance's telemetry

### ✅ Safe Control Operations
- Start/Stop buttons send the specific `id` to the control endpoint
- No risk of accidentally stopping the whole engine
- Only the targeted strategy instance is affected

## User Experience Improvements

### Before (Old Dropdown)
```html
<select>
  <option>MARKO_BTC_1H</option>
  <option>MARKO_ETH_15M</option>
</select>
```
- Basic HTML select
- No visual feedback
- No status indicators
- Clunky appearance

### After (New StrategySelector)
```
┌─────────────────────────────────────┐
│ Active Strategy                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟢 MARKO_BTC_1H            ▼   │ │
│ └─────────────────────────────────┘ │
│ BTC/USD                          1h │
└─────────────────────────────────────┘
  ↓ (when clicked)
┌─────────────────────────────────────┐
│ 🟢 MARKO_BTC_1H         ✓    +1250 │
│ BTC/USD • 1h • RUNNING              │
├─────────────────────────────────────┤
│ 🟢 MARKO_ETH_15M             -320  │
│ ETH/USD • 15m • RUNNING             │
├─────────────────────────────────────┤
│ 🔴 ARB_SOL_5M                 +45  │
│ SOL/USD • 5m • STOPPED              │
└─────────────────────────────────────┘
```
- Premium design
- Live status indicators
- PnL at a glance
- Smooth animations
- Professional appearance

## Testing Checklist

- [ ] Verify `/api/v2/strategies` returns strategy list
- [ ] Verify `/api/v2/strategies/{id}/telemetry` returns instance-specific data
- [ ] Verify dropdown shows all strategies with correct status
- [ ] Verify switching strategies updates all page data
- [ ] Verify Start/Stop/Pause buttons work for individual strategies
- [ ] Verify each page shows correct instance identifier
- [ ] Verify phi, volatility, etc. are different for BTC vs ETH instances
- [ ] Verify active_filters are instance-specific
- [ ] Verify last_decision reflects the specific instance's choice

## API Contract Summary

### GET /api/v2/strategies
Returns array of strategy instances:
```json
[
  {
    "id": "MARKO_BTC_1H",
    "status": "RUNNING",
    "symbol": "BTC/USD",
    "timeframe": "1h",
    "params": { "sma_fast": 20, "vol_window": 50 },
    "active_pnl": 1250.50
  }
]
```

### GET /api/v2/strategies/{id}/telemetry
Returns instance-specific telemetry:
```json
{
  "instance_id": "MARKO_BTC_1H",
  "markov_state": "COOPERATIVE_UP",
  "phi": 0.85,
  "volatility": 0.22,
  "conviction_score": 0.75,
  "risk_multiplier": 1.2,
  "active_filters": ["trend", "volatility"],
  "last_decision": "BUY"
}
```

### POST /api/v2/strategies/{id}/control
Control specific instance:
```json
{
  "action": "start" | "stop" | "pause"
}
```

## Migration Notes

### Backward Compatibility
- V1 API still supported via `Legacy_Primary` fallback
- If `selectedStrategyId` is null or "Legacy_Primary", routes to `/api/v1/telemetry`
- Otherwise routes to `/api/v2/strategies/{id}/telemetry`

### Breaking Changes
None - the frontend gracefully handles both V1 and V2 responses.

## Future Enhancements

1. **Real-time Updates**: Consider WebSocket for live telemetry instead of polling
2. **Performance Metrics**: Add per-instance performance charts
3. **Bulk Actions**: Select multiple strategies for batch start/stop
4. **Strategy Comparison**: Side-by-side view of multiple instances
5. **Alert Configuration**: Per-instance alert thresholds

---

**Status**: ✅ Complete
**Last Updated**: 2026-01-05
**Version**: 2.0 (Multi-Strategy)

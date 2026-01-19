import React, { useEffect, useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useStrategy } from '../context/StrategyContext';
import StatCard from '../components/StatCard';
import PriceChart from '../components/PriceChart';
import { Link } from 'react-router-dom';
import { Settings, Activity } from 'lucide-react';

export default function Overview() {
    const {
        data: telemetryData,
        chartData,
        loading,
        refreshTelemetry,
        refreshChart,
        lastUpdated
    } = useTelemetry();
    const { strategies, selectedStrategyId, selectStrategy } = useStrategy();

    // Derived state for the "Current View"
    // Option A: Prefer "Selected" strategy from global context
    const currentStrategy = strategies.find(s => s.id === selectedStrategyId);

    // If no strategy is explicitly selected but we have a running fleet, 
    // we might want to default to the "first running" one if the context didn't already.
    // However, StrategyContext usually handles selection defaults.

    // Refresh data when page loads
    useEffect(() => {
        refreshTelemetry();
        refreshChart();
    }, [selectedStrategyId]); // Re-fetch if selection changes

    // Loading state handling
    if (loading && !telemetryData?.status) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-textMuted animate-pulse space-y-4">
                <Activity size={32} className="text-primary" />
                <span className="font-mono tracking-widest text-xs">ESTABLISHING UPLINK...</span>
            </div>
        );
    }

    // If we have no active strategies, show a "Welcome/Empty" state
    if (strategies.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
                <div className="p-6 bg-surfaceHighlight rounded-full">
                    <Activity size={48} className="text-textMuted" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">Systems Offline</h2>
                    <p className="text-textSecondary max-w-md mx-auto">
                        No active strategy instances detected. Deploy a strategy from the Marketplace to begin autonomous trading operations.
                    </p>
                </div>
                <Link
                    to="/marketplace"
                    className="px-6 py-3 bg-primary text-background font-bold rounded hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                    <Settings size={18} />
                    OPEN MARKETPLACE
                </Link>
            </div>
        );
    }

    // Telemetry Data (V2 Structure)
    // The TelemetryContext already normalizes V1/V2 differences into `telemetryData`.
    const { status } = telemetryData || {};
    if (!status) return null; // Should be handled by loading state, but defensive

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
    const formatPercent = (val) => `${(val || 0).toFixed(2)}%`;

    const pockets = telemetryData?.pockets || [];
    const pocketTotals = useMemo(() => {
        const totals = {
            equity: 0,
            unrealized: 0,
            count: pockets.length
        };
        if (!pockets.length) {
            return totals;
        }
        pockets.forEach((pocket) => {
            totals.equity += Number(pocket.equity || 0);
            totals.unrealized += Number(pocket.unrealized_pnl || 0);
        });
        return totals;
    }, [pockets]);

    const normalizedStatus = (status.status || 'UNKNOWN').toUpperCase();
    const isRunning = normalizedStatus === 'RUNNING' || normalizedStatus === 'ACTIVE' || normalizedStatus === 'LIVE';

    const statusClasses = isRunning
        ? 'bg-statusGood/10 text-statusGood border-statusGood/20'
        : normalizedStatus === 'STARTING' || normalizedStatus === 'WARMUP'
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            : 'bg-statusBad/10 text-textMuted border-statusBad/20'; // Stopped/Error

    return (
        <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Header / Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                <div>
                    <h2 className="text-xl font-bold text-text font-mono tracking-tight flex items-center gap-2">
                        <Activity size={20} className="text-primary" />
                        SYSTEM OVERVIEW
                    </h2>
                    {currentStrategy ? (
                        <p className="text-xs text-textMuted font-mono mt-1 flex items-center gap-2">
                            TARGET: <span className="text-text font-bold text-primary">{currentStrategy.id}</span>
                            <span className="opacity-30">|</span>
                            {currentStrategy.symbol}
                            <span className="opacity-30">|</span>
                            {currentStrategy.timeframe}
                        </p>
                    ) : (
                        <p className="text-xs text-textMuted font-mono mt-1">Global Aggregate View</p>
                    )}
                </div>

                {/* Status Pill */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            refreshTelemetry();
                            refreshChart();
                        }}
                        className="px-3 py-1.5 text-xs font-mono rounded border border-border text-textSecondary hover:text-text hover:border-text transition-colors"
                    >
                        Refresh
                    </button>
                    <div className="text-[10px] text-textMuted font-mono">
                        Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--:--'}
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold font-mono border flex items-center gap-2 ${statusClasses}`}>
                        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-current animate-pulse' : 'bg-current'}`} />
                        {status.status}
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <StatCard
                    label="Total Equity"
                    value={formatCurrency(pocketTotals.equity || status.equity)}
                    subValue={pocketTotals.count ? 'Sum of pockets' : 'Real-time NAV'}
                />
                <StatCard
                    label="Pocket PnL"
                    value={formatCurrency(pocketTotals.unrealized)}
                    status={pocketTotals.unrealized >= 0 ? 'good' : 'bad'}
                    subValue={pocketTotals.count ? `${pocketTotals.count} pockets` : 'No pockets'}
                />
                <StatCard
                    label="Cash"
                    value={formatCurrency(status.cash)}
                    subValue="Available Balance"
                />
                <StatCard
                    label="Unrealized PnL"
                    value={formatCurrency(status.unrealizedPnL)}
                    status={status.unrealizedPnL >= 0 ? 'good' : 'bad'}
                    subValue={status.unrealizedPnL >= 0 ? '+ Profit' : '- Loss'}
                />
                <StatCard
                    label="Exposure"
                    value={formatPercent((status.exposurePct || 0) * 100)}
                    subValue="Portfolio Risk"
                />
                <StatCard
                    label="Open Positions"
                    value={status.openPositionsCount}
                    subValue="Active Exposure"
                />
                <StatCard
                    label="Last Heartbeat"
                    value={status.heartbeat ? new Date(status.heartbeat).toLocaleTimeString() : '--:--:--'}
                    subValue={status.heartbeat ? new Date(status.heartbeat).toLocaleDateString() : 'N/A'}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart takes up 2/3 */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-surface border border-border rounded-lg p-1">
                        <PriceChart chartData={chartData} />
                    </div>
                    <div className="bg-surface border border-border rounded-lg p-5">
                        <h3 className="text-xs text-textMuted mb-3 uppercase tracking-wider font-bold">Positions Snapshot</h3>
                        {telemetryData.positions?.length ? (
                            <div className="space-y-2 text-xs font-mono">
                                {telemetryData.positions.slice(0, 5).map((pos) => (
                                    <div key={pos.symbol} className="flex items-center justify-between">
                                        <div className="text-text">{pos.symbol}</div>
                                        <div className="text-textSecondary">
                                            {pos.size} @ {formatCurrency(pos.currentPrice)}
                                        </div>
                                        <div className={pos.unrealizedPnL >= 0 ? 'text-statusGood' : 'text-statusBad'}>
                                            {formatCurrency(pos.unrealizedPnL)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-textSecondary font-mono">No open positions.</div>
                        )}
                    </div>
                </div>

                {/* Side Feed / Strategy Info 1/3 */}
                <div className="space-y-4">
                    {/* Last Action Card */}
                    <div className="bg-surface border border-border rounded-lg p-5">
                        <h3 className="text-xs text-textMuted mb-2 uppercase tracking-wider font-bold">Latest Decision</h3>
                        <div className="text-2xl font-mono font-medium text-text">
                            {status.lastAction}
                        </div>
                        {currentStrategy && (
                            <div className="mt-4 pt-4 border-t border-border/50 text-xs font-mono text-textSecondary space-y-1">
                                <div className="flex justify-between">
                                    <span>Regime:</span>
                                    <span className="text-text">{telemetryData.strategy.regime}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Phi (Stability):</span>
                                    <span className="text-text">{telemetryData.strategy.phi?.toFixed(2) ?? '-'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Strategy Switcher (Compact) */}
                    {strategies.length > 1 && (
                        <div className="bg-surface border border-border rounded-lg p-4">
                            <h3 className="text-xs text-textMuted mb-3 uppercase tracking-wider font-bold">Active Fleet</h3>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {strategies.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => selectStrategy(s.id)}
                                        className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-colors flex justify-between items-center ${s.id === selectedStrategyId
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'hover:bg-surfaceHighlight text-textSecondary border border-transparent'
                                            }`}
                                    >
                                        <span>{s.id}</span>
                                        <span className={s.status === 'RUNNING' ? 'text-statusGood' : 'text-textMuted'}>
                                            ●
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Portfolio Breakdown (Full Width) */}
            <div className="bg-surface border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs text-textMuted uppercase tracking-wider font-bold">Portfolio Breakdown</h3>
                    <div className="text-[10px] text-textMuted font-mono">
                        Total {formatCurrency(pocketTotals.equity || status.equity)}
                    </div>
                </div>
                {pockets.length ? (
                    <div className="space-y-2 text-xs font-mono">
                        {pockets.map((pocket) => (
                            <div key={pocket.pocket_id} className="flex items-center justify-between">
                                <div className="text-text">{pocket.pocket_id}</div>
                                <div className="text-textSecondary">{formatCurrency(pocket.equity)}</div>
                                <div className={pocket.unrealized_pnl >= 0 ? 'text-statusGood' : 'text-statusBad'}>
                                    {formatCurrency(pocket.unrealized_pnl)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-textSecondary font-mono">No pocket data available.</div>
                )}
            </div>
        </div>
    );
}

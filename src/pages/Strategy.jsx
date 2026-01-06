import React, { useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useStrategy } from '../context/StrategyContext';
import StatCard from '../components/StatCard';
import { AlertCircle, Loader } from 'lucide-react';

// Helper functions for interpretative labels
const getPhiLabel = (phi) => {
    if (phi === null || phi === undefined) return 'Unknown';
    if (phi < 0.3) return 'Low';
    if (phi < 0.7) return 'Medium';
    return 'High';
};

const getVolatilityLabel = (volatility) => {
    if (volatility === null || volatility === undefined) return 'Unknown';
    if (volatility < 0.15) return 'Calm';
    if (volatility < 0.30) return 'Normal';
    return 'Elevated';
};

const getRiskMultiplierLabel = (multiplier) => {
    if (multiplier === null || multiplier === undefined) return 'Unknown';
    if (multiplier < 0.8) return 'Defensive';
    if (multiplier < 1.2) return 'Neutral';
    return 'Aggressive';
};

const getConvictionLabel = (conviction) => {
    if (conviction === null || conviction === undefined) return 'Unknown';
    if (conviction < 0.4) return 'Low Confidence';
    if (conviction < 0.7) return 'Medium Confidence';
    return 'High Confidence';
};

export default function Strategy() {
    const { data, refreshTelemetry, error, loading } = useTelemetry();
    const { strategies, selectedStrategyId } = useStrategy();

    // Defensive destructuring
    const strategy = data?.strategy;

    // Get the current strategy info
    const currentStrategy = strategies.find(s => s.id === selectedStrategyId);

    // Refresh data when page loads
    useEffect(() => {
        refreshTelemetry();
    }, []);

    if (error) {
        return (
            <div className="p-4 rounded-md bg-statusBad/10 border border-statusBad/20 text-statusBad flex items-center gap-3">
                <AlertCircle size={20} />
                <div className="flex flex-col">
                    <span className="font-bold text-sm">Error Fetching Strategy Data</span>
                    <span className="text-xs font-mono opacity-80">{error}</span>
                </div>
            </div>
        );
    }

    if (loading && !strategy) {
        return (
            <div className="flex items-center justify-center h-64 text-textMuted gap-2">
                <Loader className="animate-spin" size={20} />
                <span className="font-mono text-sm">SYNCING STRATEGY STATE...</span>
            </div>
        );
    }

    if (!strategy) {
        return (
            <div className="p-8 text-center border border-dashed border-border rounded-lg text-textMuted">
                No active strategy state available.
            </div>
        );
    }

    const {
        regime,
        phi,
        volatility,
        risk_multiplier,
        conviction_score,
        filters,
        last_decision
    } = strategy;

    const activeFilters = Object.entries(filters ?? {});
    const hasActiveFilters = activeFilters.length > 0;

    return (
        <div className="flex flex-col gap-4">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">
                    Strategy State
                </h2>
                {currentStrategy && (
                    <p className="text-sm text-textMuted font-mono mt-1">
                        Instance: <span className="text-primary">{currentStrategy.id}</span> • {currentStrategy.symbol} • {currentStrategy.timeframe}
                    </p>
                )}
                <p className="text-xs text-textMuted mt-1">
                    These logical fields are specific to this strategy instance's isolated memory and parameters.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard
                    label="Current Regime"
                    value={(regime ?? 'UNKNOWN').replace(/_/g, ' ')}
                    subValue="Markov Model State"
                />

                <div className="card flex flex-col gap-2">
                    <div className="text-[11px] text-textMuted uppercase tracking-wider font-medium">
                        φ (Phi) • Regime Stability
                    </div>
                    <div className="text-2xl font-mono text-text font-medium">
                        {phi !== null && phi !== undefined ? phi.toFixed(3) : '—'}
                    </div>
                    <div className="text-xs text-textSecondary">
                        {getPhiLabel(phi)}
                    </div>
                </div>

                <div className="card flex flex-col gap-2">
                    <div className="text-[11px] text-textMuted uppercase tracking-wider font-medium">
                        Volatility
                    </div>
                    <div className="text-2xl font-mono text-text font-medium">
                        {volatility !== null && volatility !== undefined ? (volatility * 100).toFixed(1) + '%' : '—'}
                    </div>
                    <div className="text-xs text-textSecondary">
                        {getVolatilityLabel(volatility)}
                    </div>
                </div>

                <div className="card flex flex-col gap-2">
                    <div className="text-[11px] text-textMuted uppercase tracking-wider font-medium">
                        Risk Multiplier
                    </div>
                    <div className="text-2xl font-mono text-text font-medium">
                        {risk_multiplier !== null && risk_multiplier !== undefined ? risk_multiplier.toFixed(2) + 'x' : '—'}
                    </div>
                    <div className="text-xs text-textSecondary">
                        {getRiskMultiplierLabel(risk_multiplier)}
                    </div>
                </div>

                <div className="card flex flex-col gap-2">
                    <div className="text-[11px] text-textMuted uppercase tracking-wider font-medium">
                        Conviction Score
                    </div>
                    <div className="text-2xl font-mono text-text font-medium">
                        {conviction_score !== null && conviction_score !== undefined ? (conviction_score * 100).toFixed(1) + '%' : '—'}
                    </div>
                    <div className="text-xs text-textSecondary">
                        {getConvictionLabel(conviction_score)}
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mt-4">
                {/* Active Filters */}
                <div className="card flex-1">
                    <h3 className="text-sm text-textMuted mb-4 uppercase tracking-wider">
                        Active Filters
                    </h3>

                    <div className="flex flex-col gap-2">
                        {hasActiveFilters ? (
                            activeFilters.map(([key, active]) => (
                                <div
                                    key={key}
                                    className="flex justify-between items-center py-2 border-b border-border last:border-0"
                                >
                                    <span className="font-mono text-[13px] uppercase">
                                        {key}
                                    </span>

                                    <span className={`text-xs font-semibold ${active ? 'text-statusGood' : 'text-textMuted'}`}>
                                        {active ? 'ACTIVE' : 'OFF'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-textMuted italic py-2">
                                No active risk filters.
                            </div>
                        )}
                    </div>
                </div>

                {/* Last Decision */}
                <div className="card flex-1">
                    <h3 className="text-sm text-textMuted mb-4 uppercase tracking-wider">
                        Deep Thought
                    </h3>

                    <div className="text-sm leading-relaxed text-text">
                        {last_decision
                            ? `"${last_decision}"`
                            : '—'}
                    </div>
                </div>
            </div>
        </div>
    );
}

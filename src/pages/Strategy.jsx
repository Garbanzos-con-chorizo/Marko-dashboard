import React, { useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import StatCard from '../components/StatCard';

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
    const { data, refreshTelemetry } = useTelemetry();

    // Defensive destructuring
    const strategy = data?.strategy;

    // Refresh data when page loads
    useEffect(() => {
        refreshTelemetry();
    }, []);

    if (!strategy) return null;

    const {
        regime,
        phi,
        volatility,
        risk_multiplier,
        conviction_score,
        filters,
        last_decision
    } = strategy;

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-4">
                Strategy State
            </h2>

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
                        {Object.entries(filters ?? {}).map(([key, active]) => (
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
                        ))}
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

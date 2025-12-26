import React from 'react';
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
    const { data } = useTelemetry();

    // Defensive destructuring
    const strategy = data?.strategy;

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
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
                Strategy State
            </h2>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                }}
            >
                <StatCard
                    label="Current Regime"
                    value={(regime ?? 'UNKNOWN').replace(/_/g, ' ')}
                    subValue="Markov Model State"
                />

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        φ (Phi) • Regime Stability
                    </div>
                    <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {phi !== null && phi !== undefined ? phi.toFixed(3) : '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {getPhiLabel(phi)}
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Volatility
                    </div>
                    <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {volatility !== null && volatility !== undefined ? (volatility * 100).toFixed(1) + '%' : '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {getVolatilityLabel(volatility)}
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Risk Multiplier
                    </div>
                    <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {risk_multiplier !== null && risk_multiplier !== undefined ? risk_multiplier.toFixed(2) + 'x' : '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {getRiskMultiplierLabel(risk_multiplier)}
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Conviction Score
                    </div>
                    <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {conviction_score !== null && conviction_score !== undefined ? (conviction_score * 100).toFixed(1) + '%' : '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {getConvictionLabel(conviction_score)}
                    </div>
                </div>
            </div>

            <div className="flex gap-4" style={{ marginTop: '16px' }}>
                {/* Active Filters */}
                <div className="card" style={{ flex: 1 }}>
                    <h3
                        style={{
                            fontSize: '14px',
                            color: 'var(--text-muted)',
                            marginBottom: '16px',
                            textTransform: 'uppercase'
                        }}
                    >
                        Active Filters
                    </h3>

                    <div className="flex flex-col gap-2">
                        {Object.entries(filters ?? {}).map(([key, active]) => (
                            <div
                                key={key}
                                className="flex justify-between items-center"
                                style={{
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}
                            >
                                <span
                                    className="mono"
                                    style={{
                                        textTransform: 'uppercase',
                                        fontSize: '13px'
                                    }}
                                >
                                    {key}
                                </span>

                                <span
                                    style={{
                                        color: active
                                            ? 'var(--status-good)'
                                            : 'var(--text-muted)',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}
                                >
                                    {active ? 'ACTIVE' : 'OFF'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Last Decision */}
                <div className="card" style={{ flex: 1 }}>
                    <h3
                        style={{
                            fontSize: '14px',
                            color: 'var(--text-muted)',
                            marginBottom: '16px',
                            textTransform: 'uppercase'
                        }}
                    >
                        Deep Thought
                    </h3>

                    <div
                        style={{
                            fontSize: '14px',
                            lineHeight: '1.5',
                            color: 'var(--text-primary)'
                        }}
                    >
                        {last_decision
                            ? `"${last_decision}"`
                            : '—'}
                    </div>
                </div>
            </div>
        </div>
    );
}

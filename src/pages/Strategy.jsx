import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import StatCard from '../components/StatCard';

export default function Strategy() {
    const { data } = useTelemetry();
    const { strategy } = data;

    if (!strategy) return null;

    return (
        <div className="flex flex-col gap-4">
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Strategy State</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <StatCard
                    label="Current Regiem"
                    value={strategy.state.replace('_', ' ')}
                    subValue="Markov Model State"
                />
                <StatCard
                    label="Conviction Score"
                    value={(strategy.conviction * 100).toFixed(1) + '%'}
                    subValue="Model Confidence"
                />
                <StatCard
                    label="Risk Multiplier"
                    value={strategy.riskMultiplier.toFixed(2) + 'x'}
                    subValue="Position Sizing Factor"
                />
            </div>

            <div className="flex gap-4" style={{ marginTop: '16px' }}>
                {/* Active Filters */}
                <div className="card" style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase' }}>Active Filters</h3>
                    <div className="flex flex-col gap-2">
                        {Object.entries(strategy.filters).map(([key, active]) => (
                            <div key={key} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span className="mono" style={{ textTransform: 'uppercase', fontSize: '13px' }}>{key}</span>
                                <span style={{
                                    color: active ? 'var(--status-good)' : 'var(--text-muted)',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    {active ? 'ACTIVE' : 'OFF'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Last Decision */}
                <div className="card" style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase' }}>Deep Thought</h3>
                    <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                        "{strategy.lastDecisionReason}"
                    </div>
                </div>
            </div>
        </div>
    );
}

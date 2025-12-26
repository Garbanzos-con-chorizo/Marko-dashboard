import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import StatCard from '../components/StatCard';
import PriceChart from '../components/PriceChart';

export default function Overview() {
    const { data, chartData, loading } = useTelemetry();
    const { status, strategy } = data;

    if (loading) return <div style={{ color: 'var(--text-muted)' }}>Initializing telemetry stream...</div>;
    if (!status) return null;

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px' }}>System Overview</h2>
                <div style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    background: status.status === 'RUNNING' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: status.status === 'RUNNING' ? 'var(--status-good)' : 'var(--status-bad)',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: '1px solid currentColor'
                }}>
                    {status.status}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <StatCard
                    label="Total Equity"
                    value={formatCurrency(status.equity)}
                    subValue="Real-time NAV"
                />
                <StatCard
                    label="Unrealized PnL"
                    value={formatCurrency(status.unrealizedPnL)}
                    status={status.unrealizedPnL >= 0 ? 'good' : 'bad'}
                    subValue={status.unrealizedPnL >= 0 ? '+ Profit' : '- Loss'}
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

            {/* Price Chart */}
            <PriceChart chartData={chartData} />

            <div className="card" style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Last Engine Action</h3>
                <div className="mono" style={{ fontSize: '16px', color: 'var(--accent-primary)' }}>
                    {status.lastAction}
                </div>
            </div>
        </div>
    );
}

import React, { useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import StatCard from '../components/StatCard';
import PriceChart from '../components/PriceChart';

export default function Overview() {
    const { data, chartData, loading, refreshTelemetry, refreshChart } = useTelemetry();
    const { status, strategy } = data;

    // Refresh data when page loads
    useEffect(() => {
        refreshTelemetry();
        refreshChart();
    }, []);

    if (loading) return <div className="text-textMuted">Initializing telemetry stream...</div>;
    if (!status) return null;

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const statusClasses = status.status === 'RUNNING'
        ? 'bg-green-400/10 text-statusGood border-current'
        : 'bg-red-400/10 text-statusBad border-current';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">System Overview</h2>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusClasses}`}>
                    {status.status}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="card mt-4">
                <h3 className="text-sm text-textMuted mb-3 uppercase tracking-wider">Last Engine Action</h3>
                <div className="font-mono text-base text-primary">
                    {status.lastAction}
                </div>
            </div>
        </div>
    );
}

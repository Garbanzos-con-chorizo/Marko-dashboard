import React, { useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';

export default function Positions() {
    const { data, refreshTelemetry } = useTelemetry();

    const rawPositions = data?.positions;
    const status = data?.status;

    // Refresh data when page loads
    useEffect(() => {
        refreshTelemetry();
    }, []);

    // Normalize positions to array (CRITICAL FIX)
    const positions = Array.isArray(rawPositions)
        ? rawPositions
        : rawPositions && typeof rawPositions === 'object'
            ? Object.values(rawPositions)
            : [];

    const formatCurrency = (val) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(val ?? 0);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Open Positions</h2>
                <div className="text-[13px] text-textMuted">
                    Exposure:{' '}
                    <span className="text-text">
                        {status?.openPositionsCount ?? positions.length} Assets
                    </span>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-surfaceHighlight text-left text-textMuted">
                                <th className="p-4 font-medium whitespace-nowrap">SYMBOL</th>
                                <th className="p-4 font-medium text-right whitespace-nowrap">SIZE</th>
                                <th className="p-4 font-medium text-right whitespace-nowrap">ENTRY</th>
                                <th className="p-4 font-medium text-right whitespace-nowrap">UNREALIZED PnL</th>
                            </tr>
                        </thead>

                        <tbody>
                            {positions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-6 text-center text-textMuted">
                                        No open positions.
                                    </td>
                                </tr>
                            ) : (
                                positions.map((pos, idx) => (
                                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-surfaceHighlight/50 transition-colors">
                                        <td className="p-4 font-mono font-semibold">
                                            {pos.symbol ?? '—'}
                                        </td>

                                        <td className="p-4 text-right font-mono">
                                            {pos.size ?? 0}
                                        </td>

                                        <td className="p-4 text-right font-mono">
                                            {formatCurrency(pos.avgPrice)}
                                        </td>

                                        <td className={`p-4 text-right font-mono ${(pos.unrealizedPnL ?? 0) >= 0 ? 'text-statusGood' : 'text-statusBad'
                                            }`}>
                                            {(pos.unrealizedPnL ?? 0) >= 0 ? '+' : ''}
                                            {formatCurrency(pos.unrealizedPnL)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

import React, { useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useStrategy } from '../context/StrategyContext';

export default function Positions() {
    const { data, refreshTelemetry } = useTelemetry();
    const { strategies, selectedStrategyId } = useStrategy();

    const rawPositions = data?.positions;
    const status = data?.status;

    // Get the current strategy info
    const currentStrategy = strategies.find(s => s.id === selectedStrategyId);

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
                <div>
                    <h2 className="text-xl font-semibold">Open Positions</h2>
                    {currentStrategy && (
                        <p className="text-sm text-textMuted font-mono mt-1">
                            Instance: <span className="text-primary">{currentStrategy.id}</span> • {currentStrategy.symbol}
                        </p>
                    )}
                </div>
                <div className="text-[13px] text-textMuted">
                    Exposure:{' '}
                    <span className="text-text">
                        {status?.openPositionsCount ?? positions.length} Assets
                    </span>
                </div>
            </div>

            {/* Strategy Breakdown (Pockets) */}
            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-border bg-surfaceHighlight/30">
                    <h3 className="text-sm font-bold text-text uppercase tracking-wider">Strategy Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-surfaceHighlight/50 text-left text-textMuted text-xs">
                                <th className="p-4 font-medium whitespace-nowrap">STRATEGY ID</th>
                                <th className="p-4 font-medium text-right whitespace-nowrap">EQUITY</th>
                                <th className="p-4 font-medium text-right whitespace-nowrap">POCKET PnL</th>
                                <th className="p-4 font-medium text-right whitespace-nowrap">POSITIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!data?.pockets || data.pockets.length === 0) ? (
                                <tr>
                                    <td colSpan="4" className="p-6 text-center text-textMuted italic">
                                        No strategy pockets active.
                                    </td>
                                </tr>
                            ) : (
                                data.pockets.map((pocket, idx) => (
                                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-surfaceHighlight/50 transition-colors">
                                        <td className="p-4 font-mono font-semibold text-primary">
                                            {pocket.pocket_id}
                                        </td>
                                        <td className="p-4 text-right font-mono text-text">
                                            {formatCurrency(pocket.equity)}
                                        </td>
                                        <td className={`p-4 text-right font-mono font-bold ${(pocket.unrealized_pnl >= 0) ? 'text-statusGood' : 'text-statusBad'
                                            }`}>
                                            {(pocket.unrealized_pnl >= 0) ? '+' : ''}{formatCurrency(pocket.unrealized_pnl)}
                                        </td>
                                        <td className="p-4 text-right font-mono text-textSecondary">
                                            {pocket.positions?.length || 0}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-border bg-surfaceHighlight/30">
                    <h3 className="text-sm font-bold text-text uppercase tracking-wider">Deep Position Detail</h3>
                </div>
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

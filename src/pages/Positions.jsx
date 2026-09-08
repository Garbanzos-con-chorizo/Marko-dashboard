import React, { useEffect, useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useStrategy } from '../context/StrategyContext';
import { api } from '../services/api';

export default function Positions() {
    const { data, refreshTelemetry } = useTelemetry();
    const { strategies, selectedStrategyId } = useStrategy();
    const [cancelling, setCancelling] = useState(null); // order_id in flight
    const [cancelError, setCancelError] = useState(null);

    const handleCancel = async (orderId) => {
        if (!selectedStrategyId) return;
        setCancelling(orderId);
        setCancelError(null);
        try {
            await api.controlStrategy(selectedStrategyId, 'cancel_order', { order_id: orderId });
            setTimeout(() => refreshTelemetry(), 1500);
        } catch (err) {
            setCancelError(err.message || 'Cancel failed');
        } finally {
            setCancelling(null);
        }
    };

    const rawPositions = data?.positions;
    const status = data?.status;
    const openOrders = Array.isArray(data?.open_orders) ? data.open_orders : [];

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

            {/* Working orders: submitted, not yet filled or cancelled. A target
                the strategy re-emits counts these toward its position, so
                what is shown here is what the engine will not re-send. */}
            <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-border bg-surfaceHighlight/30 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text uppercase tracking-wider">Working Orders</h3>
                    <span className="text-xs font-mono text-textMuted">{openOrders.length} open</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-surfaceHighlight text-left text-textMuted">
                                <th className="p-4 font-medium whitespace-nowrap">SYMBOL</th>
                                <th className="p-4 font-medium whitespace-nowrap">SIDE</th>
                                <th className="p-4 font-medium whitespace-nowrap">TYPE</th>
                                <th className="p-4 font-medium text-right whitespace-nowrap">QTY</th>
                                <th className="p-4 font-medium text-right whitespace-nowrap">FILLED</th>
                                <th className="p-4 font-medium text-right whitespace-nowrap">LIMIT / STOP</th>
                                <th className="p-4 font-medium whitespace-nowrap">SUBMITTED</th>
                                <th className="p-4 font-medium whitespace-nowrap">CLIENT ID</th>
                                <th className="p-4 font-medium whitespace-nowrap"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cancelError && (
                                <tr><td colSpan="9" className="p-3 text-xs text-statusBad font-mono">{cancelError}</td></tr>
                            )}
                            {openOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-6 text-center text-textMuted">
                                        No working orders.
                                    </td>
                                </tr>
                            ) : (
                                openOrders.map((o) => (
                                    <tr key={o.order_id} className="border-b border-border last:border-0 hover:bg-surfaceHighlight/50 transition-colors">
                                        <td className="p-4 font-mono font-semibold">{o.symbol}</td>
                                        <td className={`p-4 font-mono font-bold ${o.side === 'BUY' ? 'text-statusGood' : 'text-statusBad'}`}>{o.side}</td>
                                        <td className="p-4 font-mono text-textSecondary">{o.order_type || 'MARKET'}</td>
                                        <td className="p-4 text-right font-mono">{o.qty}</td>
                                        <td className="p-4 text-right font-mono">{o.qty_filled ?? 0}</td>
                                        <td className="p-4 text-right font-mono">
                                            {o.limit_price != null ? formatCurrency(o.limit_price) : '—'}
                                            {o.stop_price != null ? ` / ${formatCurrency(o.stop_price)}` : ''}
                                        </td>
                                        <td className="p-4 font-mono text-textMuted text-xs">
                                            {o.submitted_at ? new Date(o.submitted_at).toLocaleString() : '—'}
                                        </td>
                                        <td className="p-4 font-mono text-textMuted text-xs" title={o.client_order_id || ''}>
                                            {o.client_order_id ? o.client_order_id.slice(0, 12) + '…' : '—'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleCancel(o.order_id)}
                                                disabled={cancelling === o.order_id}
                                                className="px-2 py-1 text-[11px] font-bold rounded border border-statusBad/30 text-statusBad hover:bg-statusBad/10 disabled:opacity-50"
                                                title="Ask the broker to cancel this order"
                                            >
                                                {cancelling === o.order_id ? 'CANCELLING…' : 'CANCEL'}
                                            </button>
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

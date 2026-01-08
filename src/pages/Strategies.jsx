import React, { useState } from 'react';
import { useStrategy } from '../context/StrategyContext';
import { useTelemetry } from '../context/TelemetryContext';
import { adminService } from '../services/adminService';
import { Play, Square, Pause, Activity, TrendingUp, TrendingDown, Trash2, AlertTriangle, X, CheckCircle } from 'lucide-react';

export default function Strategies() {
    const { strategies, selectedStrategyId, selectStrategy, controlStrategy, refreshStrategies, loading } = useStrategy();
    const { data: telemetryData } = useTelemetry();

    const [deleteTarget, setDeleteTarget] = useState(null); // { id, symbol, status }
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleControl = async (e, id, action) => {
        e.stopPropagation();
        await controlStrategy(id, action);
    };

    const handleDeleteClick = (e, strategy) => {
        e.stopPropagation();
        setDeleteTarget(strategy);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await adminService.deleteInstance(deleteTarget.id);
            showToast(`Instance ${deleteTarget.id} removed.`, 'success');
            setDeleteTarget(null);
            // Instant refresh
            refreshStrategies();
        } catch (error) {
            showToast(`Failed to delete: ${error.message}`, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading && strategies.length === 0) {
        return <div className="p-8 text-center text-textMuted font-mono animate-pulse">LOADING FLEET...</div>;
    }

    return (
        <div className="space-y-6 relative">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-20 right-8 z-50 p-4 border backdrop-blur-md rounded shadow-lg flex items-center gap-3 animate-slideIn ${toast.type === 'error' ? 'bg-statusBad/10 border-statusBad/20 text-statusBad' : 'bg-statusGood/10 border-statusGood/20 text-statusGood'
                    }`}>
                    {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                    <span className="font-bold text-sm tracking-wide">{toast.message}</span>
                </div>
            )}

            <header className="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-text mb-1">STRATEGY FLEET</h1>
                    <p className="text-sm font-mono text-textMuted">MANAGE ACTIVE ALGORITHMIC INSTANCES</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-surfaceHighlight rounded text-xs font-mono text-textSecondary">
                    <Activity size={14} />
                    <span>{strategies.length} INSTANCES DETECTED</span>
                </div>
            </header>

            <div className="grid gap-3">
                {strategies.map((s) => {
                    const isSelected = s.id === selectedStrategyId;

                    // High-fidelity synchronization for selected strategy
                    // CRITICAL FIX: If the fleet list says the strategy is STOPPED, REMOVED, or ERROR, 
                    // we must respect that and NOT let stale telemetry override it to "RUNNING".
                    const listStatus = (s.status || '').toUpperCase();
                    const isListStopped = listStatus === 'STOPPED' || listStatus === 'REMOVED' || listStatus === 'ERROR' || listStatus === 'CRASHED';

                    const strategy = isSelected && telemetryData?.status
                        ? {
                            ...s,
                            // Only allow telemetry to upgrade the status if the list thinks we are active/starting.
                            // If the list says we are stopped, we are stopped.
                            status: isListStopped
                                ? s.status
                                : (telemetryData.status.status && telemetryData.status.status !== 'UNKNOWN')
                                    ? telemetryData.status.status
                                    : s.status,

                            // Always take PnL from telemetry if available
                            active_pnl: telemetryData.status.unrealizedPnL ?? s.active_pnl
                        }
                        : s;

                    const rawStatus = (strategy.status || '').toUpperCase();
                    const isError = rawStatus === 'ERROR' || rawStatus === 'CRASHED';
                    const isStopped = rawStatus === 'STOPPED' || rawStatus === 'OFF' || !rawStatus;
                    const isStarting = rawStatus === 'STARTING' || rawStatus === 'WARMUP';
                    const isRunning = rawStatus === 'RUNNING' || rawStatus === 'ACTIVE' || rawStatus === 'LIVE';
                    const isPaused = rawStatus === 'PAUSED';
                    const isActive = isRunning || isStarting || isPaused;

                    return (
                        <div
                            key={strategy.id}
                            onClick={() => selectStrategy(strategy.id)}
                            className={`
                                relative p-4 rounded-lg border transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between
                                ${isSelected
                                    ? 'bg-surfaceHighlight border-primary/50 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.1)]'
                                    : 'bg-surface border-border hover:border-borderHighlight hover:bg-surfaceHighlight/30'
                                }
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-lg hidden sm:block"></div>
                            )}

                            {/* Info Section */}
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <div className={`p-2 rounded-md ${isSelected ? 'bg-primary/20 text-primary' : 'bg-background text-textSecondary'}`}>
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-text font-mono flex items-center gap-2">
                                        {strategy.id}
                                        {isSelected && <span className="text-[10px] bg-primary text-background px-1.5 py-0.5 rounded font-sans font-bold">ACTIVE</span>}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-textMuted mt-1 font-mono">
                                        <span className={`px-1 rounded text-[10px] font-bold ${(strategy.broker_type || 'PAPER') === 'LIVE'
                                                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                                                : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                            }`}>
                                            {strategy.broker_type || 'PAPER'}
                                        </span>
                                        <span className="text-text">{strategy.symbol}</span>
                                        <span className="w-1 h-1 rounded-full bg-border"></span>
                                        <span>{strategy.timeframe}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status & PnL Wrapper */}
                            <div className="flex items-center gap-6 ml-auto sm:ml-0">
                                {/* Status Badge */}
                                <div className={`
                                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider border
                                    ${isRunning
                                        ? 'bg-statusGood/10 text-statusGood border-statusGood/20'
                                        : isStarting
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            : isError
                                                ? 'bg-statusBad/10 text-statusBad border-statusBad/20'
                                                : 'bg-textMuted/10 text-textMuted border-textMuted/20' // STOPPED / OFF
                                    }
                                `}>
                                    <div className={`w-1.5 h-1.5 rounded-full 
                                        ${isRunning ? 'bg-statusGood animate-pulse'
                                            : isStarting ? 'bg-amber-500 animate-pulse'
                                                : isError ? 'bg-statusBad'
                                                    : 'bg-textMuted' /* STOPPED */
                                        }`}></div>
                                    {strategy.status || 'STOPPED'}
                                </div>

                                {/* Active PnL (Pocket PnL) */}
                                <div className="flex flex-col items-end min-w-[100px]">
                                    <span className="text-[10px] text-textMuted uppercase tracking-wider mb-0.5">Pocket PnL</span>
                                    <div className={`flex items-center gap-1.5 text-sm font-bold font-mono ${strategy.active_pnl >= 0 ? 'text-statusGood' : 'text-statusBad'}`}>
                                        {strategy.active_pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {strategy.active_pnl >= 0 ? '+' : ''}{(strategy.active_pnl || 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-end gap-2 pl-4 border-l border-border/50 shrink-0">
                                {isActive ? (
                                    <>
                                        {!isStarting && (
                                            <button
                                                onClick={(e) => handleControl(e, strategy.id, 'pause')}
                                                className="p-2 rounded hover:bg-yellow-500/20 hover:text-yellow-500 text-textMuted transition-colors"
                                                title="Pause Strategy"
                                            >
                                                <Pause size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleControl(e, strategy.id, 'stop')}
                                            className="p-2 rounded hover:bg-statusBad/20 hover:text-statusBad text-textMuted transition-colors"
                                            title="Stop Strategy"
                                        >
                                            <Square size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={(e) => handleControl(e, strategy.id, 'start')}
                                        className="p-2 rounded hover:bg-statusGood/20 hover:text-statusGood text-textMuted transition-colors"
                                        title="Start Strategy"
                                    >
                                        <Play size={16} />
                                    </button>
                                )}

                                <button
                                    onClick={(e) => handleDeleteClick(e, strategy)}
                                    className="p-2 rounded hover:bg-statusBad/20 hover:text-statusBad text-textMuted transition-colors ml-1"
                                    title="Delete Instance"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <header className="px-6 py-4 border-b border-border bg-statusBad/10 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-statusBad flex items-center gap-2">
                                <AlertTriangle size={20} />
                                CONFIRM DELETION
                            </h2>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="text-textMuted hover:text-text transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <div className="p-6">
                            <p className="text-textSecondary mb-4">
                                Are you sure you want to permanently delete the strategy instance <strong className="text-text font-mono">{deleteTarget.id}</strong>?
                            </p>

                            {(deleteTarget.status === 'RUNNING' || deleteTarget.status === 'ACTIVE') && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-amber-500 text-sm flex items-start gap-2">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <span>
                                        <strong>Warning:</strong> This strategy is currently running. Deleting it will immediately stop execution and close active loops. Open positions may remain open.
                                    </span>
                                </div>
                            )}

                            <p className="text-xs text-textMuted mt-4 italic">
                                This action cannot be undone. You will need to re-configure the instance from the Marketplace.
                            </p>
                        </div>

                        <footer className="px-6 py-4 border-t border-border bg-surfaceHighlight/10 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-text transition-colors"
                                disabled={isDeleting}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-bold bg-statusBad text-background rounded hover:bg-statusBad/90 transition-colors flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                        DELETING...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        DELETE INSTANCE
                                    </>
                                )}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}

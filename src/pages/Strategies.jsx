import React from 'react';
import { useStrategy } from '../context/StrategyContext';
import { useTelemetry } from '../context/TelemetryContext';
import { Play, Square, Pause, Activity, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

export default function Strategies() {
    const { strategies, selectedStrategyId, selectStrategy, controlStrategy, loading } = useStrategy();
    const { data: telemetryData } = useTelemetry();

    const handleControl = async (e, id, action) => {
        e.stopPropagation(); // Prevent row selection if clicked
        await controlStrategy(id, action);
    };

    if (loading && strategies.length === 0) {
        return <div className="p-8 text-center text-textMuted font-mono">LOADING STRATEGIES...</div>;
    }

    return (
        <div className="space-y-6">
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
                    // If the live telemetry shows warmup is over, we automatically transition 
                    // the status in the UI to 'RUNNING'.
                    const strategy = isSelected && telemetryData?.status
                        ? {
                            ...s,
                            status: (s.status?.toUpperCase() === 'STARTING' && !telemetryData.status.is_warming_up)
                                ? 'RUNNING'
                                : (telemetryData.status.status || s.status),
                            active_pnl: telemetryData.status.unrealizedPnL
                        }
                        : s;

                    // Normalizing status for robust matching
                    const rawStatus = (strategy.status || '').toUpperCase();

                    // Robust status checks
                    const isStopped = rawStatus === 'STOPPED' || rawStatus === 'OFF' || !rawStatus;
                    const isStarting = rawStatus === 'STARTING' || rawStatus === 'WARMUP';
                    const isRunning = rawStatus === 'RUNNING' || rawStatus === 'ACTIVE' || rawStatus === 'LIVE';
                    const isPaused = rawStatus === 'PAUSED';

                    // Grouping active states for control logic
                    const isActive = isRunning || isStarting || isPaused;

                    return (
                        <div
                            key={strategy.id}
                            onClick={() => selectStrategy(strategy.id)}
                            className={`
                                relative p-4 rounded-lg border transition-all cursor-pointer group
                                ${isSelected
                                    ? 'bg-surfaceHighlight border-primary/50 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.1)]'
                                    : 'bg-surface border-border hover:border-borderHighlight hover:bg-surfaceHighlight/30'
                                }
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-lg"></div>
                            )}

                            <div className="flex items-center justify-between flex-wrap gap-4">
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
                                            <span className="text-text">{strategy.symbol}</span>
                                            <span className="w-1 h-1 rounded-full bg-border"></span>
                                            <span>{strategy.timeframe}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider border
                                        ${isRunning
                                            ? 'bg-statusGood/10 text-statusGood border-statusGood/20'
                                            : isStarting
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                : isStopped
                                                    ? 'bg-statusBad/10 text-statusBad border-statusBad/20'
                                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        }
                                    `}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-statusGood animate-pulse' : isStarting ? 'bg-amber-500 animate-pulse' : isStopped ? 'bg-statusBad' : 'bg-yellow-500'}`}></div>
                                        {strategy.status}
                                    </div>
                                </div>

                                {/* PnL */}
                                <div className="flex flex-col items-end min-w-[120px]">
                                    <span className="text-[10px] text-textMuted uppercase tracking-wider mb-0.5">Active PnL</span>
                                    <div className={`flex items-center gap-1.5 text-sm font-bold font-mono ${strategy.active_pnl >= 0 ? 'text-statusGood' : 'text-statusBad'}`}>
                                        {strategy.active_pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {strategy.active_pnl >= 0 ? '+' : ''}{(strategy.active_pnl || 0).toFixed(2)}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-2 pl-4 border-l border-border/50">
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
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

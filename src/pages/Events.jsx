import React, { useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useStrategy } from '../context/StrategyContext';

export default function Events() {
    const { data, refreshTelemetry } = useTelemetry();
    const { strategies, selectedStrategyId } = useStrategy();
    const { events } = data;

    // Get the current strategy info
    const currentStrategy = strategies.find(s => s.id === selectedStrategyId);

    // Refresh data when page loads
    useEffect(() => {
        refreshTelemetry();
    }, []);

    if (!events) return null;

    return (
        <div className="flex flex-col gap-4">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">System Logs</h2>
                {currentStrategy && (
                    <p className="text-sm text-textMuted font-mono mt-1">
                        Instance: <span className="text-primary">{currentStrategy.id}</span> • {currentStrategy.symbol}
                    </p>
                )}
            </div>

            <div className="card p-0">
                {events.length === 0 ? (
                    <div className="p-6 text-center text-textMuted">
                        No recent events logged.
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {events.map((evt, idx) => {
                            let badgeClass = 'bg-primary text-black';
                            if (evt.type === 'WARN') badgeClass = 'bg-statusWarn text-black';
                            if (evt.type === 'ERROR') badgeClass = 'bg-statusBad text-white';

                            return (
                                <div key={idx} className="flex flex-col md:flex-row gap-2 md:gap-4 p-4 border-b border-border last:border-0 hover:bg-surfaceHighlight/30 transition-colors">
                                    <div className="font-mono text-[11px] text-textSecondary min-w-[150px] shrink-0">
                                        {new Date(evt.timestamp).toLocaleString()}
                                    </div>
                                    <div className="flex-1 text-sm break-words">
                                        <span className={`inline-block px-2 py-0.5 text-[10px] rounded font-bold mr-2 min-w-[50px] text-center ${badgeClass}`}>
                                            {evt.type}
                                        </span>
                                        <span className={evt.type === 'ERROR' ? 'text-statusBad' : 'text-text'}>
                                            {evt.message}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

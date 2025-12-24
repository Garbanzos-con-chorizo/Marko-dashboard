import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';

export default function Events() {
    const { data } = useTelemetry();
    const { events } = data;

    if (!events) return null;

    return (
        <div className="flex flex-col gap-4">
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>System Logs</h2>

            <div className="card" style={{ padding: 0 }}>
                {events.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No recent events logged.
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {events.map((evt, idx) => {
                            let color = 'var(--accent-primary)';
                            if (evt.type === 'WARN') color = 'var(--status-warn)';
                            if (evt.type === 'ERROR') color = 'var(--status-bad)';

                            return (
                                <div key={idx} className="flex gap-4" style={{
                                    padding: '12px 16px',
                                    borderBottom: idx === events.length - 1 ? 'none' : '1px solid var(--border-color)',
                                    alignItems: 'flex-start'
                                }}>
                                    <div className="mono" style={{
                                        fontSize: '11px',
                                        color: 'var(--text-secondary)',
                                        minWidth: '150px'
                                    }}>
                                        {new Date(evt.timestamp).toLocaleString()}
                                    </div>
                                    <div style={{ flex: 1, fontSize: '13px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            borderRadius: '4px',
                                            background: color,
                                            color: '#000',
                                            fontWeight: '700',
                                            marginRight: '8px',
                                            minWidth: '50px',
                                            textAlign: 'center'
                                        }}>
                                            {evt.type}
                                        </span>
                                        <span style={{ color: evt.type === 'ERROR' ? 'var(--status-bad)' : 'var(--text-primary)' }}>
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

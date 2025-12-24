import React from 'react';

export default function WarmupOverlay({ status }) {
    if (!status) return null;

    const progress = (status.warmup_progress || 0) * 100;
    const eta = status.warmup_remaining_est || 0;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-primary)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
        }}>
            <div style={{ width: '100%', maxWidth: '500px' }}>
                <h1 style={{
                    fontSize: '14px',
                    color: 'var(--accent-primary)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '20px',
                    letterSpacing: '0.1em'
                }}>
                    SYSTEM_WARMUP_IN_PROGRESS
                </h1>

                <div style={{
                    height: '4px',
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'var(--accent-primary)',
                        transition: 'width 0.5s ease'
                    }} />
                </div>

                <div className="mono" style={{ display: 'flex', justifyContent: 'between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <div style={{ flex: 1 }}>{status.lastAction}</div>
                    <div>{progress.toFixed(1)}%</div>
                </div>

                <div style={{ marginTop: '40px', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center' }}>
                    ESTIMATED TIME REMAINING: {eta.toFixed(0)}s
                    <br />
                    <span style={{ fontSize: '9px', opacity: 0.5 }}>FETCHING HISTORICAL DATA SINCE 2015</span>
                </div>
            </div>
        </div>
    );
}

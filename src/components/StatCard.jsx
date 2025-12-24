import React from 'react';

export default function StatCard({ label, value, subValue, status }) {
    let valueColor = 'var(--text-primary)';
    if (status === 'good') valueColor = 'var(--status-good)';
    if (status === 'warn') valueColor = 'var(--status-warn)';
    if (status === 'bad') valueColor = 'var(--status-bad)';

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </div>
            <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', color: valueColor, fontWeight: '500' }}>
                {value}
            </div>
            {subValue && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {subValue}
                </div>
            )}
        </div>
    );
}

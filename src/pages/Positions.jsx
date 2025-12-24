import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';

export default function Positions() {
    const { data } = useTelemetry();
    const { positions, status } = data;

    if (!positions) return null;

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px' }}>Open Positions</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Exposure: <span style={{ color: 'var(--text-primary)' }}>{status?.openPositionsCount || 0} Assets</span>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '12px 16px', fontWeight: '500' }}>SYMBOL</th>
                            <th style={{ padding: '12px 16px', fontWeight: '500', textAlign: 'right' }}>SIZE</th>
                            <th style={{ padding: '12px 16px', fontWeight: '500', textAlign: 'right' }}>ENTRY</th>
                            <th style={{ padding: '12px 16px', fontWeight: '500', textAlign: 'right' }}>UNREALIZED PnL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No open positions.
                                </td>
                            </tr>
                        ) : (
                            positions.map((pos, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{pos.symbol}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{pos.size}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatCurrency(pos.avgPrice)}</td>
                                    <td style={{
                                        padding: '12px 16px',
                                        textAlign: 'right',
                                        fontFamily: 'var(--font-mono)',
                                        color: pos.unrealizedPnL >= 0 ? 'var(--status-good)' : 'var(--status-bad)'
                                    }}>
                                        {pos.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(pos.unrealizedPnL)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

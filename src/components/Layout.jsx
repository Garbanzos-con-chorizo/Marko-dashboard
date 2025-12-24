import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';

const NavLink = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: active ? 'var(--bg-tertiary)' : 'transparent',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: 'none',
            borderLeft: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
            padding: '12px 16px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
        }}
    >
        {label}
    </button>
);

export default function Layout({ currentPage, onNavigate, children }) {
    const { lastUpdated, error } = useTelemetry();

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h1 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                        MARKO V4
                    </h1>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        ALGORITHMIC TRADING
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '16px 0' }}>
                    <NavLink label="OVERVIEW" active={currentPage === 'overview'} onClick={() => onNavigate('overview')} />
                    <NavLink label="STRATEGY" active={currentPage === 'strategy'} onClick={() => onNavigate('strategy')} />
                    <NavLink label="POSITIONS" active={currentPage === 'positions'} onClick={() => onNavigate('positions')} />
                    <NavLink label="EVENTS / LOGS" active={currentPage === 'events'} onClick={() => onNavigate('events')} />
                </nav>

                <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', fontSize: '11px' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>STATUS</div>
                    {error ? (
                        <div style={{ color: 'var(--status-bad)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                            API ERROR
                        </div>
                    ) : (
                        <div style={{ color: 'var(--status-good)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                            SYSTEM ONLINE
                        </div>
                    )}
                    <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                        LAST UPD: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)', position: 'relative' }}>
                {/* Error Banner */}
                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderBottom: '1px solid var(--status-bad)',
                        color: 'var(--status-bad)',
                        padding: '8px 16px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        ⚠️ CONNECTION LOST. DISPLAYING STALE DATA.
                    </div>
                )}

                <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}

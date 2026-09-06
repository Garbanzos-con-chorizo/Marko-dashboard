import React, { useEffect, useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useStrategy } from '../context/StrategyContext';
import { useStrategyCatalog } from '../context/StrategyCatalogContext';
import StatCard from '../components/StatCard';
import SchemaMetrics from '../components/SchemaMetrics'; // Import Schema Metrics
import { AlertCircle, Loader, ShieldAlert, ShieldCheck, RotateCcw } from 'lucide-react';

// Human labels for the risk limits the engine reports. Order matters: it is
// the order they are displayed in.
const RISK_LIMIT_LABELS = [
    ['max_order_pct_equity', 'Max order / equity', (v) => `${(v * 100).toFixed(0)}%`],
    ['max_order_notional', 'Max order notional', (v) => `$${Number(v).toLocaleString()}`],
    ['max_position_pct_equity', 'Max position / equity', (v) => `${(v * 100).toFixed(0)}%`],
    ['max_position_notional', 'Max position notional', (v) => `$${Number(v).toLocaleString()}`],
    ['max_gross_exposure', 'Max gross exposure', (v) => `${Number(v).toFixed(2)}x`],
    ['daily_loss_limit_pct', 'Daily loss kill switch', (v) => `${(v * 100).toFixed(1)}%`],
    ['daily_loss_limit_abs', 'Daily loss (absolute)', (v) => `$${Number(v).toLocaleString()}`],
    ['max_orders_per_minute', 'Orders / minute', (v) => `${v}`],
];

export default function Strategy() {
    const { data, refreshTelemetry, error, loading } = useTelemetry();
    const { strategies, selectedStrategyId, controlStrategy } = useStrategy();
    const [resetting, setResetting] = useState(false);
    const risk = data?.risk || null;
    const riskLimits = data?.risk_limits || null;
    const killSwitchTripped = risk?.tripped === true;

    const handleResetKillSwitch = async () => {
        if (!selectedStrategyId) return;
        setResetting(true);
        try {
            await controlStrategy(selectedStrategyId, 'reset_kill_switch');
            setTimeout(() => refreshTelemetry(), 500);
        } finally {
            setResetting(false);
        }
    };
    const { fetchSchema, strategies: catalogDefinitions } = useStrategyCatalog();
    const [currentSchema, setCurrentSchema] = useState(null);

    // Defensive destructuring
    const strategy = data?.strategy;

    // Get the current strategy info
    const currentStrategy = strategies.find(s => s.id === selectedStrategyId);

    // Refresh data when page loads
    useEffect(() => {
        refreshTelemetry();
    }, []);

    const normalizeId = (value) => {
        if (!value) return '';
        return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    const resolveDefinitionId = (candidates = []) => {
        if (!catalogDefinitions || catalogDefinitions.length === 0) return null;
        const normalizedCandidates = candidates.map(normalizeId).filter(Boolean);
        if (normalizedCandidates.length === 0) return null;

        for (const def of catalogDefinitions) {
            const defId = String(def.id);
            const defName = normalizeId(def.name);
            const defEntrypoint = normalizeId(def.entrypoint);
            if (
                normalizedCandidates.includes(normalizeId(defId)) ||
                (defName && normalizedCandidates.includes(defName)) ||
                (defEntrypoint && normalizedCandidates.includes(defEntrypoint))
            ) {
                return defId;
            }
        }

        return null;
    };

    // Prefer schema directly from telemetry (if available)
    useEffect(() => {
        if (data?.telemetry_schema) {
            setCurrentSchema(data.telemetry_schema);
        }
    }, [data?.telemetry_schema]);

    // Fetch Schema from catalog when strategy metadata is available
    useEffect(() => {
        if (data?.telemetry_schema) {
            return;
        }
        const definitionId = resolveDefinitionId([
            strategy?.name,
            currentStrategy?.id
        ]);

        if (definitionId) {
            fetchSchema(definitionId).then(schema => {
                if (schema) setCurrentSchema(schema);
            });
        }
    }, [data?.telemetry_schema, strategy?.name, currentStrategy?.id, catalogDefinitions, fetchSchema]);

    if (error) {
        return (
            <div className="p-4 rounded-md bg-statusBad/10 border border-statusBad/20 text-statusBad flex items-center gap-3">
                <AlertCircle size={20} />
                <div className="flex flex-col">
                    <span className="font-bold text-sm">Error Fetching Strategy Data</span>
                    <span className="text-xs font-mono opacity-80">{error}</span>
                </div>
            </div>
        );
    }

    if (loading && !strategy) {
        return (
            <div className="flex items-center justify-center h-64 text-textMuted gap-2">
                <Loader className="animate-spin" size={20} />
                <span className="font-mono text-sm">SYNCING STRATEGY STATE...</span>
            </div>
        );
    }

    if (!strategy) {
        return (
            <div className="p-8 text-center border border-dashed border-border rounded-lg text-textMuted">
                No active strategy state available.
            </div>
        );
    }

    const {
        regime,
        phi, // Fallback fields
        volatility,
        filters,
        last_decision
    } = strategy;

    const activeFilters = Object.entries(filters ?? {});
    const hasActiveFilters = activeFilters.length > 0;

    return (
        <div className="flex flex-col gap-4">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">
                    Strategy State
                </h2>
                {currentStrategy && (
                    <p className="text-sm text-textMuted font-mono mt-1">
                        Instance: <span className="text-primary">{currentStrategy.id}</span> • {currentStrategy.symbol} • {currentStrategy.timeframe}
                    </p>
                )}
                <p className="text-xs text-textMuted mt-1">
                    {currentSchema
                        ? "Dynamic telemetry provided by strategy schema."
                        : "Displaying legacy standard telemetry fields."}
                </p>
            </div>

            {/* Render Schema-Driven Metrics if Schema exists, else Legacy Fallback */}
            {currentSchema ? (
                <SchemaMetrics schema={currentSchema} data={strategy} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <StatCard
                        label="Current Regime"
                        value={(regime ?? 'UNKNOWN').replace(/_/g, ' ')}
                        subValue="Markov Model State"
                    />

                    <div className="card flex flex-col gap-2">
                        <div className="text-[11px] text-textMuted uppercase tracking-wider font-medium">
                            φ (Phi) • Regime Stability
                        </div>
                        <div className="text-2xl font-mono text-text font-medium">
                            {phi !== null && phi !== undefined ? phi.toFixed(3) : '—'}
                        </div>
                        <div className="text-xs text-textSecondary">
                            {/* Inline logic for legacy label */}
                            {phi < 0.3 ? 'Low' : phi < 0.7 ? 'Medium' : 'High'}
                        </div>
                    </div>

                    <div className="card flex flex-col gap-2">
                        <div className="text-[11px] text-textMuted uppercase tracking-wider font-medium">
                            Volatility
                        </div>
                        <div className="text-2xl font-mono text-text font-medium">
                            {volatility !== null && volatility !== undefined ? (volatility * 100).toFixed(1) + '%' : '—'}
                        </div>
                        <div className="text-xs text-textSecondary">
                            {volatility < 0.15 ? 'Calm' : volatility < 0.30 ? 'Normal' : 'Elevated'}
                        </div>
                    </div>
                </div>
            )}

            {/* Risk layer: kill-switch state and the limits in force. */}
            <div className={`card mt-4 border ${killSwitchTripped ? 'border-statusBad/40' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm text-textMuted uppercase tracking-wider flex items-center gap-2">
                        {killSwitchTripped
                            ? <ShieldAlert size={16} className="text-statusBad" />
                            : <ShieldCheck size={16} className="text-statusGood" />}
                        Risk Layer
                    </h3>
                    {killSwitchTripped && (
                        <button
                            onClick={handleResetKillSwitch}
                            disabled={resetting}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-statusBad/10 text-statusBad border border-statusBad/30 hover:bg-statusBad/20 disabled:opacity-50"
                            title="Re-arm the kill switch. The day's loss baseline is re-taken from the next equity reading."
                        >
                            <RotateCcw size={12} /> {resetting ? 'RESETTING…' : 'RESET KILL SWITCH'}
                        </button>
                    )}
                </div>

                {risk ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div>
                            <div className="text-[11px] text-textMuted uppercase tracking-wider">Kill switch</div>
                            <div className={`font-mono font-bold ${killSwitchTripped ? 'text-statusBad' : 'text-statusGood'}`}>
                                {killSwitchTripped ? 'TRIPPED' : 'ARMED'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-textMuted uppercase tracking-wider">Day drawdown</div>
                            <div className="font-mono">{risk.drawdown_pct != null ? `${(risk.drawdown_pct * 100).toFixed(2)}%` : '—'}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-textMuted uppercase tracking-wider">Day start equity</div>
                            <div className="font-mono">{risk.start_equity != null ? Number(risk.start_equity).toFixed(2) : '—'}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-textMuted uppercase tracking-wider">Last equity</div>
                            <div className="font-mono">{risk.last_equity != null ? Number(risk.last_equity).toFixed(2) : '—'}</div>
                        </div>
                        {killSwitchTripped && risk.reason && (
                            <div className="col-span-2 sm:col-span-4 text-xs text-statusBad font-mono">{risk.reason}</div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-textMuted italic mb-4">No risk state reported yet (waiting for the first broker refresh).</div>
                )}

                {riskLimits && (
                    <div className="flex flex-wrap gap-2">
                        {RISK_LIMIT_LABELS.map(([key, label, fmt]) => (
                            <span key={key} className="px-2 py-1 rounded bg-surfaceHighlight border border-border text-[11px] font-mono" title={key}>
                                <span className="text-textMuted">{label}: </span>
                                <span className="text-text">{riskLimits[key] == null ? 'off' : fmt(riskLimits[key])}</span>
                            </span>
                        ))}
                        {Array.isArray(riskLimits.blocked_symbols) && riskLimits.blocked_symbols.length > 0 && (
                            <span className="px-2 py-1 rounded bg-surfaceHighlight border border-border text-[11px] font-mono">
                                <span className="text-textMuted">Blocked: </span>
                                <span className="text-text">{riskLimits.blocked_symbols.join(', ')}</span>
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mt-4">
                {/* Active Filters */}
                <div className="card flex-1">
                    <h3 className="text-sm text-textMuted mb-4 uppercase tracking-wider">
                        Active Filters
                    </h3>

                    <div className="flex flex-col gap-2">
                        {hasActiveFilters ? (
                            activeFilters.map(([key, active]) => (
                                <div
                                    key={key}
                                    className="flex justify-between items-center py-2 border-b border-border last:border-0"
                                >
                                    <span className="font-mono text-[13px] uppercase">
                                        {key}
                                    </span>

                                    <span className={`text-xs font-semibold ${active ? 'text-statusGood' : 'text-textMuted'}`}>
                                        {active ? 'ACTIVE' : 'OFF'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-textMuted italic py-2">
                                No active risk filters.
                            </div>
                        )}
                    </div>
                </div>

                {/* Last Decision */}
                <div className="card flex-1">
                    <h3 className="text-sm text-textMuted mb-4 uppercase tracking-wider">
                        Deep Thought
                    </h3>

                    <div className="text-sm leading-relaxed text-text">
                        {last_decision
                            ? `"${last_decision}"`
                            : '—'}
                    </div>
                </div>
            </div>
        </div>
    );
}

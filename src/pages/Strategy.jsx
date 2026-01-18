import React, { useEffect, useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useStrategy } from '../context/StrategyContext';
import { useStrategyCatalog } from '../context/StrategyCatalogContext';
import StatCard from '../components/StatCard';
import SchemaMetrics from '../components/SchemaMetrics'; // Import Schema Metrics
import { AlertCircle, Loader } from 'lucide-react';

export default function Strategy() {
    const { data, refreshTelemetry, error, loading } = useTelemetry();
    const { strategies, selectedStrategyId } = useStrategy();
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

    // Fetch Schema when strategy metadata is available
    useEffect(() => {
        const definitionId = resolveDefinitionId([
            strategy?.name,
            currentStrategy?.id
        ]);

        if (definitionId) {
            fetchSchema(definitionId).then(schema => {
                if (schema) setCurrentSchema(schema);
            });
        }
    }, [strategy?.name, currentStrategy?.id, catalogDefinitions, fetchSchema]);

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
        risk_multiplier,
        conviction_score,
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

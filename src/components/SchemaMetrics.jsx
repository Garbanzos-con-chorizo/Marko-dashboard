import React from 'react';
import StatCard from './StatCard';

const getLabelForField = (field, value) => {
    // Basic heuristics for labels based on common field names
    // In a mature system, the schema might provide range interpretations
    if (field === 'phi') {
        if (value < 0.3) return 'Low';
        if (value < 0.7) return 'Medium';
        return 'High';
    }
    if (field === 'volatility') {
        if (value < 0.05) return 'Low';
        if (value < 0.30) return 'Normal';
        return 'Elevated';
    }
    return null;
};

const formatValue = (field, value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value !== 'number') return value.toString();

    if (field.includes('percent') || field.includes('score') || field === 'volatility' || field === 'phi') {
        // Assume decimal needing % if common name, else just number
        if (field === 'phi') return value.toFixed(3);
        return (value * 100).toFixed(1) + '%';
    }
    if (field.includes('multiplier')) {
        return value.toFixed(2) + 'x';
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

export default function SchemaMetrics({ schema, data }) {
    if (!schema || !schema.fields || !Array.isArray(schema.fields)) {
        // Fallback or empty state if no schema
        return <div className="text-textMuted text-xs font-mono">No schema definition available.</div>;
    }

    const getFieldName = (field) => {
        if (typeof field === 'string') return field;
        if (field && typeof field === 'object') return field.name || '';
        return '';
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Always show Regime if present, assuming it's core */}
            {(data.regime || data.markov_state) && (
                <StatCard
                    label="Current Regime"
                    value={((data.regime || data.markov_state) + '').replace(/_/g, ' ')}
                    subValue="Core State"
                />
            )}

            {/* Dynamic Fields */}
            {schema.fields.map((field, index) => {
                const fieldName = getFieldName(field);
                if (!fieldName) return null;
                const value = data[fieldName];
                // Skip if main regime already shown manually (optional preference)
                if (fieldName === 'regime' || fieldName === 'markov_state') return null;

                return (
                    <div key={`${fieldName}-${index}`} className="card flex flex-col gap-2">
                        <div className="text-[11px] text-textMuted uppercase tracking-wider font-medium">
                            {fieldName.replace(/_/g, ' ')}
                        </div>
                        <div className="text-2xl font-mono text-text font-medium">
                            {formatValue(fieldName, value)}
                        </div>
                        <div className="text-xs text-textSecondary">
                            {getLabelForField(fieldName, value) || '—'}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

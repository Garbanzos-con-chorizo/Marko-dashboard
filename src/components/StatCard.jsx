import React from 'react';

export default function StatCard({ label, value, subValue, status }) {
    let valueColorClass = 'text-text';
    if (status === 'good') valueColorClass = 'text-statusGood';
    if (status === 'warn') valueColorClass = 'text-statusWarn';
    if (status === 'bad') valueColorClass = 'text-statusBad';

    return (
        <div className="card flex flex-col gap-2">
            <div className="text-[11px] text-textMuted uppercase tracking-wider font-medium">
                {label}
            </div>
            <div className={`text-2xl font-mono font-medium ${valueColorClass}`}>
                {value}
            </div>
            {subValue && (
                <div className="text-xs text-textSecondary">
                    {subValue}
                </div>
            )}
        </div>
    );
}

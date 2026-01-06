import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Activity } from 'lucide-react';

export default function StrategySelector({ strategies, selectedStrategyId, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (strategyId) => {
        onSelect(strategyId);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="text-[10px] text-textMuted uppercase font-bold mb-1.5 block tracking-wider">
                Active Strategy
            </label>

            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-background border border-border rounded-md px-3 py-2.5 flex items-center justify-between gap-2 hover:border-primary/50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${(selectedStrategy?.status?.toUpperCase() === 'RUNNING' || selectedStrategy?.status?.toUpperCase() === 'ACTIVE')
                            ? 'bg-statusGood animate-pulse'
                            : selectedStrategy?.status?.toUpperCase() === 'STARTING'
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-statusBad'
                        }`} />
                    <span className="text-xs font-mono text-text truncate">
                        {selectedStrategy?.id || 'Select Strategy'}
                    </span>
                </div>
                <ChevronDown
                    size={14}
                    className={`text-textMuted group-hover:text-primary transition-all duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {/* Strategy Info */}
            {selectedStrategy && (
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-textMuted px-1">
                    <span className="font-mono">{selectedStrategy.symbol}</span>
                    <span className="font-mono">{selectedStrategy.timeframe}</span>
                </div>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[280px] overflow-y-auto">
                        {strategies.map((strategy) => {
                            const isSelected = strategy.id === selectedStrategyId;

                            // Normalizing status for robust matching
                            const rawStatus = (strategy.status || '').toUpperCase();
                            const isRunning = rawStatus === 'RUNNING' || rawStatus === 'ACTIVE';
                            const isStarting = rawStatus === 'STARTING';

                            return (
                                <button
                                    key={strategy.id}
                                    onClick={() => handleSelect(strategy.id)}
                                    className={`
                                        w-full px-3 py-2.5 flex items-center gap-2 transition-all duration-150
                                        ${isSelected
                                            ? 'bg-primary/10 text-text'
                                            : 'hover:bg-surfaceHighlight text-textSecondary hover:text-text'
                                        }
                                        border-b border-border last:border-0
                                    `}
                                >
                                    {/* Status Indicator */}
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${isRunning ? 'bg-statusGood' : isStarting ? 'bg-amber-500' : 'bg-statusBad'
                                        }`} />

                                    {/* Strategy Info */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-medium truncate">
                                                {strategy.id}
                                            </span>
                                            {isSelected && (
                                                <Check size={12} className="text-primary shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-textMuted mt-0.5">
                                            <span>{strategy.symbol}</span>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span>{strategy.timeframe}</span>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span className={isRunning ? 'text-statusGood' : isStarting ? 'text-amber-500' : 'text-statusBad'}>
                                                {strategy.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* PnL Badge */}
                                    <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${strategy.active_pnl >= 0
                                        ? 'text-statusGood bg-statusGood/10'
                                        : 'text-statusBad bg-statusBad/10'
                                        }`}>
                                        {strategy.active_pnl >= 0 ? '+' : ''}{strategy.active_pnl.toFixed(0)}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

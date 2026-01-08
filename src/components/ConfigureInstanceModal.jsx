import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import { Play, Info, AlertTriangle, Shield, Key } from 'lucide-react';

export default function ConfigureInstanceModal({ strategy, onClose, onSuccess }) {
    const [instanceId, setInstanceId] = useState('');
    const [symbol, setSymbol] = useState('');
    const [timeframe, setTimeframe] = useState('1h');

    // Broker Configuration State
    const [broker, setBroker] = useState('ALPACA');
    const [executionMode, setExecutionMode] = useState('PAPER');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');

    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);

    // Auto-generate ID suggestion
    const generateId = (sym, tf) => {
        if (!sym || !tf) return;
        const cleanSymbol = sym.replace(/[^a-zA-Z0-9]/g, '');
        setInstanceId(`${strategy.id}_${cleanSymbol}_${tf}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!instanceId || !symbol || !timeframe) return;

        setIsCreating(true);
        setError(null);

        try {
            await adminService.createInstance(strategy.id, {
                instanceId,
                symbol: symbol.toUpperCase(),
                timeframe,
                // NEW: Broker Config Payload
                broker_config: {
                    broker,
                    mode: executionMode,
                    api_key: apiKey || null,
                    api_secret: apiSecret || null
                }
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create instance.');
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-surfaceHighlight/30 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-text flex items-center gap-2">
                            <Play size={18} className="text-primary" />
                            DEPLOY NEW INSTANCE
                        </h2>
                        <p className="text-xs text-textMuted font-mono mt-0.5">
                            BASED ON: <span className="text-primary">{strategy.name || strategy.id}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-textMuted hover:text-text transition-colors"
                    >
                        ✕
                    </button>
                </header>

                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* Error Banner */}
                    {error && (
                        <div className="p-3 bg-statusBad/10 border border-statusBad/20 rounded text-statusBad text-sm flex items-start gap-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Basic Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-textSecondary uppercase mb-1.5 ml-1">Symbol</label>
                            <input
                                type="text"
                                placeholder="BTC/USD"
                                value={symbol}
                                onChange={(e) => {
                                    setSymbol(e.target.value);
                                    if (!instanceId) generateId(e.target.value, timeframe);
                                }}
                                className="w-full p-3 bg-background border border-border rounded focus:outline-none focus:border-primary text-sm font-mono uppercase"
                                disabled={isCreating}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-textSecondary uppercase mb-1.5 ml-1">Timeframe</label>
                            <select
                                value={timeframe}
                                onChange={(e) => {
                                    setTimeframe(e.target.value);
                                    if (!instanceId && symbol) generateId(symbol, e.target.value);
                                }}
                                className="w-full p-3 bg-background border border-border rounded focus:outline-none focus:border-primary text-sm font-mono"
                                disabled={isCreating}
                            >
                                <option value="1m">1m</option>
                                <option value="5m">5m</option>
                                <option value="15m">15m</option>
                                <option value="1h">1h</option>
                                <option value="4h">4h</option>
                                <option value="1d">1d</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-textSecondary uppercase mb-1.5 ml-1">
                            Instance ID <span className="text-textMuted font-normal normal-case">(Must be unique)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Trend_BTC_1h"
                            value={instanceId}
                            onChange={(e) => setInstanceId(e.target.value)}
                            className="w-full p-3 bg-background border border-border rounded focus:outline-none focus:border-primary text-sm font-mono"
                            disabled={isCreating}
                        />
                    </div>

                    {/* Broker Configuration */}
                    <div className="border-t border-border pt-4 mt-4">
                        <h3 className="text-xs font-bold text-primary tracking-widest uppercase mb-3 flex items-center gap-2">
                            <Shield size={14} /> BROKER SETTINGS
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] font-bold text-textMuted uppercase mb-1">Provider</label>
                                <select
                                    value={broker}
                                    onChange={(e) => setBroker(e.target.value)}
                                    className="w-full p-2.5 bg-background border border-border rounded text-sm focus:border-primary"
                                    disabled={isCreating}
                                >
                                    <option value="ALPACA">Alpaca Markets</option>
                                    <option value="BINANCE">Binance</option>
                                    <option value="COINBASE">Coinbase</option>
                                    <option value="PAPER">Internal Paper</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-textMuted uppercase mb-1">Execution Mode</label>
                                <select
                                    value={executionMode}
                                    onChange={(e) => setExecutionMode(e.target.value)}
                                    className="w-full p-2.5 bg-background border border-border rounded text-sm focus:border-primary"
                                    disabled={isCreating}
                                >
                                    <option value="PAPER">Paper Trading</option>
                                    <option value="LIVE">Live Trading</option>
                                </select>
                            </div>
                        </div>

                        {/* Credentials Inputs */}
                        <div className="space-y-3 bg-surfaceHighlight/30 p-3 rounded-lg border border-border/50">
                            <div className="flex items-start gap-2 mb-2">
                                <Key size={14} className="text-textMuted mt-0.5" />
                                <span className="text-[10px] font-bold text-textMuted uppercase">API Credentials (Optional)</span>
                            </div>

                            <input
                                type="text"
                                placeholder="Public API Key (e.g. PK...)"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full p-2 bg-background border border-border rounded text-xs font-mono placeholder:text-textMuted/50 focus:border-primary"
                                disabled={isCreating}
                            />
                            <input
                                type="password"
                                placeholder="Secret Key"
                                value={apiSecret}
                                onChange={(e) => setApiSecret(e.target.value)}
                                className="w-full p-2 bg-background border border-border rounded text-xs font-mono placeholder:text-textMuted/50 focus:border-primary"
                                disabled={isCreating}
                            />
                            <p className="text-[10px] text-textMuted italic">
                                Leave blank to use system default environment variables.
                            </p>
                        </div>
                    </div>

                    <div className="p-3 bg-surfaceHighlight/50 border border-border rounded text-xs text-textMuted mt-2">
                        <div className="flex items-center gap-2 mb-1 font-bold text-textSecondary">
                            <Info size={14} />
                            <span>DEPLOYMENT NOTE</span>
                        </div>
                        This will create a new configuration entry for this strategy.
                        The trading engine must be restarted for this new instance to begin trading.
                    </div>
                </div>

                <footer className="px-6 py-4 border-t border-border bg-surfaceHighlight/10 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-text transition-colors"
                        disabled={isCreating}
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isCreating || !symbol || !instanceId}
                        className={`
                            px-4 py-2 text-sm font-bold bg-primary text-background rounded transition-all
                            ${(isCreating || !symbol || !instanceId) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'}
                            flex items-center gap-2
                        `}
                    >
                        {isCreating ? (
                            <>
                                <div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                CREATING...
                            </>
                        ) : (
                            <>
                                CREATE INSTANCE
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
}

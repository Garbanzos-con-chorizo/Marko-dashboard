import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import { Key, Shield, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * EditCredentialsModal
 * Updates broker credentials for an EXISTING strategy instance.
 *
 * Alpaca (and most brokers) only allow one active key pair at a time —
 * generating a new key revokes the old one. When that happens the
 * previously stored, encrypted credential silently stops working (orders
 * and market data both start failing with 401s). This modal is the
 * self-service fix: it re-saves the credential and asks the running engine
 * to rebuild its broker adapter and market data feed with the new key,
 * without needing to delete and recreate the whole instance.
 */
export default function EditCredentialsModal({ instance, onClose, onSuccess }) {
    const [broker, setBroker] = useState(instance?.broker_type || 'ALPACA');
    const [mode, setMode] = useState(instance?.execution_mode || 'PAPER');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!apiKey || !apiSecret) return;

        setIsSaving(true);
        setError(null);

        try {
            await adminService.updateInstanceCredentials(instance.id, {
                broker,
                mode,
                api_key: apiKey,
                api_secret: apiSecret,
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to update credentials.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-surfaceHighlight/30">
                    <div>
                        <h2 className="text-lg font-bold text-text flex items-center gap-2">
                            <Key size={18} className="text-primary" />
                            EDIT CREDENTIALS
                        </h2>
                        <p className="text-xs text-textMuted font-mono mt-0.5">
                            INSTANCE: <span className="text-primary">{instance?.id}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-textMuted hover:text-text transition-colors"
                    >
                        ✕
                    </button>
                </header>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-statusBad/10 border border-statusBad/20 rounded text-statusBad text-sm flex items-start gap-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-amber-500 text-xs flex items-start gap-2">
                        <RefreshCw size={14} className="shrink-0 mt-0.5" />
                        <span>
                            Most brokers only allow one active key at a time — generating a new key
                            revokes the old one. If trades have silently stopped, the stored key was
                            likely revoked this way. Paste the current valid key below.
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-textMuted uppercase mb-1">Provider</label>
                            <select
                                value={broker}
                                onChange={(e) => setBroker(e.target.value)}
                                className="w-full p-2.5 bg-background border border-border rounded text-sm focus:border-primary"
                                disabled={isSaving}
                            >
                                <option value="ALPACA">Alpaca Markets</option>
                                <option value="BINANCE">Binance</option>
                                    <option value="KRAKEN">Kraken (paper = local simulation)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-textMuted uppercase mb-1">Execution Mode</label>
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value)}
                                className="w-full p-2.5 bg-background border border-border rounded text-sm focus:border-primary"
                                disabled={isSaving}
                            >
                                <option value="PAPER">Paper Trading</option>
                                <option value="LIVE">Live Trading</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3 bg-surfaceHighlight/30 p-3 rounded-lg border border-border/50">
                        <div className="flex items-start gap-2 mb-2">
                            <Shield size={14} className="text-textMuted mt-0.5" />
                            <span className="text-[10px] font-bold text-textMuted uppercase">New API Credentials</span>
                        </div>

                        <input
                            type="text"
                            placeholder="Public API Key (e.g. PK...)"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full p-2 bg-background border border-border rounded text-xs font-mono placeholder:text-textMuted/50 focus:border-primary"
                            disabled={isSaving}
                            autoFocus
                        />
                        <input
                            type="password"
                            placeholder="Secret Key"
                            value={apiSecret}
                            onChange={(e) => setApiSecret(e.target.value)}
                            className="w-full p-2 bg-background border border-border rounded text-xs font-mono placeholder:text-textMuted/50 focus:border-primary"
                            disabled={isSaving}
                        />
                        <p className="text-[10px] text-textMuted italic">
                            This replaces the currently stored key for this instance only.
                        </p>
                    </div>

                    <div className="p-3 bg-surfaceHighlight/50 border border-border rounded text-xs text-textMuted">
                        The running engine will rebuild its broker connection and market data feed
                        with the new key within a few seconds — no restart needed.
                    </div>
                </div>

                <footer className="px-6 py-4 border-t border-border bg-surfaceHighlight/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-text transition-colors"
                        disabled={isSaving}
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || !apiKey || !apiSecret}
                        className={`
                            px-4 py-2 text-sm font-bold bg-primary text-background rounded transition-all
                            ${(isSaving || !apiKey || !apiSecret) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'}
                            flex items-center gap-2
                        `}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                SAVING...
                            </>
                        ) : 'UPDATE CREDENTIALS'}
                    </button>
                </footer>
            </div>
        </div>
    );
}

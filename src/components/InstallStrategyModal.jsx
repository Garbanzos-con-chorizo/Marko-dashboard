import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import { Download, Info, Shield, ShieldOff } from 'lucide-react';

/**
 * InstallStrategyModal
 * Shared install-from-git modal used by both Marketplace and Library pages.
 *
 * Props
 * -----
 * defaultVisibility : "PUBLIC" | "PRIVATE"
 * onClose           : () => void
 * onSuccess         : () => void  (optional, called after successful install)
 */
export default function InstallStrategyModal({ defaultVisibility = 'PUBLIC', onClose, onSuccess }) {
    const [repoUrl, setRepoUrl]         = useState('');
    const [version, setVersion]         = useState('main');
    const [visibility, setVisibility]   = useState(defaultVisibility);
    const [gitToken, setGitToken]       = useState('');
    const [useRiskManager, setUseRiskManager] = useState(true);

    const [isInstalling, setIsInstalling] = useState(false);
    const [installStatus, setInstallStatus] = useState(null);

    const handleInstall = async (e) => {
        e.preventDefault();
        if (!repoUrl) return;

        setIsInstalling(true);
        setInstallStatus(null);

        try {
            await adminService.installStrategy(repoUrl, version, visibility, gitToken, useRiskManager);
            setInstallStatus({
                type: 'success',
                message: visibility === 'PUBLIC'
                    ? 'Strategy installed successfully! It is now available in the catalog.'
                    : 'Strategy installed successfully! It is now available in your library.',
            });
            setRepoUrl('');
            setVersion('main');
            setGitToken('');
            setUseRiskManager(true);
            onSuccess?.();
        } catch (err) {
            setInstallStatus({ type: 'error', message: err.message || 'Installation failed.' });
        } finally {
            setIsInstalling(false);
        }
    };

    const labelClass = 'block text-xs font-bold text-textSecondary uppercase mb-1.5 ml-1';
    const inputClass = 'w-full p-3 bg-background border border-border rounded focus:outline-none focus:border-primary text-sm font-mono';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-surfaceHighlight/30 shrink-0">
                    <h2 className="text-lg font-bold text-text flex items-center gap-2">
                        <Download size={18} className="text-primary" />
                        {defaultVisibility === 'PRIVATE' ? 'INSTALL PRIVATE STRATEGY' : 'INSTALL STRATEGY PACKAGE'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-textMuted hover:text-text transition-colors text-lg leading-none"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </header>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto">

                    {/* Status banner */}
                    {installStatus && (
                        <div className={`p-3 rounded text-sm border flex items-start gap-2 ${
                            installStatus.type === 'success'
                                ? 'bg-statusGood/10 border-statusGood/20 text-statusGood'
                                : 'bg-statusBad/10 border-statusBad/20 text-statusBad'
                        }`}>
                            <Info size={16} className="shrink-0 mt-0.5" />
                            <span>{installStatus.message}</span>
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Git Repository URL</label>
                        <input
                            type="text"
                            placeholder="https://github.com/username/strategy-repo.git"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            className={inputClass}
                            disabled={isInstalling}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Version / Tag / Branch</label>
                        <input
                            type="text"
                            placeholder="main"
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            className={inputClass}
                            disabled={isInstalling}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Visibility</label>
                        <select
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value)}
                            className={inputClass}
                            disabled={isInstalling}
                        >
                            <option value="PUBLIC">PUBLIC (MARKETPLACE)</option>
                            <option value="PRIVATE">PRIVATE (LIBRARY)</option>
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Git Token (Optional)</label>
                        <input
                            type="password"
                            placeholder="Paste personal access token for private HTTPS repos"
                            value={gitToken}
                            onChange={(e) => setGitToken(e.target.value)}
                            className={inputClass}
                            disabled={isInstalling}
                        />
                        <p className="text-[10px] text-textMuted mt-1 ml-1 font-mono">
                            Token is used only for cloning private repos.
                        </p>
                    </div>

                    {/* Risk Manager Toggle */}
                    <div className={`rounded-lg border p-4 transition-colors ${
                        useRiskManager
                            ? 'bg-primary/5 border-primary/20'
                            : 'bg-statusWarning/5 border-statusWarning/20'
                    }`}>
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            {/* Custom checkbox */}
                            <div className="relative mt-0.5 shrink-0">
                                <input
                                    type="checkbox"
                                    checked={useRiskManager}
                                    onChange={(e) => setUseRiskManager(e.target.checked)}
                                    disabled={isInstalling}
                                    className="sr-only peer"
                                />
                                <div className={`w-9 h-5 rounded-full transition-colors peer-disabled:opacity-50 ${
                                    useRiskManager ? 'bg-primary' : 'bg-border'
                                }`} />
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                    useRiskManager ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    {useRiskManager
                                        ? <Shield size={13} className="text-primary shrink-0" />
                                        : <ShieldOff size={13} className="text-statusWarning shrink-0" />
                                    }
                                    <span className={`text-xs font-bold tracking-wide ${
                                        useRiskManager ? 'text-primary' : 'text-statusWarning'
                                    }`}>
                                        {useRiskManager ? 'MARKO RISK MANAGER ENABLED' : 'MARKO RISK MANAGER DISABLED'}
                                    </span>
                                </div>
                                <p className="text-[11px] text-textMuted leading-relaxed">
                                    {useRiskManager
                                        ? 'Orders from this strategy will be validated by Marko\'s built-in risk checks (symbol blocklist, quantity sanity). Recommended for strategies without their own risk controls.'
                                        : 'Orders will bypass Marko\'s risk checks and go directly to the broker. Only disable if this strategy implements its own internal risk management.'
                                    }
                                </p>
                            </div>
                        </label>
                    </div>

                </div>

                {/* Footer */}
                <footer className="px-6 py-4 border-t border-border bg-surfaceHighlight/10 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-text transition-colors"
                        disabled={isInstalling}
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleInstall}
                        disabled={isInstalling || !repoUrl}
                        className={`px-4 py-2 text-sm font-bold bg-primary text-background rounded transition-all flex items-center gap-2 ${
                            (isInstalling || !repoUrl) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
                        }`}
                    >
                        {isInstalling ? (
                            <>
                                <div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                INSTALLING...
                            </>
                        ) : 'INSTALL PACKAGE'}
                    </button>
                </footer>
            </div>
        </div>
    );
}

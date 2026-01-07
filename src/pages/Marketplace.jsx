import React, { useState } from 'react';
import { useStrategyCatalog } from '../context/StrategyCatalogContext';
import { adminService } from '../services/adminService';
import { Package, Download, GitBranch, Terminal, AlertCircle, Search, Info, Plus } from 'lucide-react';
import ConfigureInstanceModal from '../components/ConfigureInstanceModal';
import StrategyDetailsModal from '../components/StrategyDetailsModal';

export default function Marketplace() {
    const { strategies, loading, error: catalogError } = useStrategyCatalog();
    const [installModalOpen, setInstallModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // UI State
    const [selectedStrategy, setSelectedStrategy] = useState(null); // For config modal
    const [detailsStrategy, setDetailsStrategy] = useState(null); // For details modal
    const [toastMessage, setToastMessage] = useState(null);

    // Install State
    const [repoUrl, setRepoUrl] = useState('');
    const [version, setVersion] = useState('main');
    const [isInstalling, setIsInstalling] = useState(false);
    const [installStatus, setInstallStatus] = useState(null); // { type: 'success' | 'error', message: '' }

    const filteredStrategies = strategies.filter(s =>
        String(s.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInstall = async (e) => {
        e.preventDefault();
        if (!repoUrl) return;

        setIsInstalling(true);
        setInstallStatus(null);

        try {
            await adminService.installStrategy(repoUrl, version);
            setInstallStatus({ type: 'success', message: 'Strategy installed successfully! It is now available in the catalog.' });
            setRepoUrl('');
            setVersion('main');
            // Ideally we would trigger a catalog refresh here, but for now we rely on the user or auto-refresh
        } catch (err) {
            setInstallStatus({ type: 'error', message: err.message || 'Installation failed.' });
        } finally {
            setIsInstalling(false);
        }
    };

    const handleInstanceCreated = () => {
        setToastMessage("Instance created. Initializing and warming up...");
        setTimeout(() => setToastMessage(null), 5000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-textMuted font-mono animate-pulse">
                LOADING CATALOG...
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* Success Toast */}
            {toastMessage && (
                <div className="fixed top-20 right-8 z-50 p-4 bg-statusGood/10 border border-statusGood/20 backdrop-blur-md rounded shadow-lg text-statusGood flex items-center gap-3 animate-slideIn">
                    <Info size={20} />
                    <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
                </div>
            )}

            <header className="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-text mb-1 flex items-center gap-2">
                        <Package className="text-primary" size={24} />
                        STRATEGY MARKETPLACE
                    </h1>
                    <p className="text-sm font-mono text-textMuted">BROWSE AND INSTALL ALGORITHMIC STRATEGIES</p>
                </div>
                <button
                    onClick={() => setInstallModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded font-bold hover:bg-primary/90 transition-colors"
                >
                    <Download size={16} />
                    INSTALL FROM GIT
                </button>
            </header>

            {/* Verification / Status Banner */}
            {catalogError && (
                <div className="p-4 bg-statusBad/10 border border-statusBad/20 rounded text-statusBad flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span className="font-mono text-sm">{catalogError}</span>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
                <input
                    type="text"
                    placeholder="Search available strategies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded focus:outline-none focus:border-primary text-sm font-mono text-text placeholder:text-textMuted/50"
                />
            </div>

            {/* Strategies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStrategies.map((strategy) => (
                    <div key={strategy.id} className="bg-surface border border-border p-5 rounded-lg hover:border-borderHighlight transition-colors group relative overflow-hidden">
                        {/* Decorative Top Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-surfaceHighlight rounded text-primary">
                                <Package size={24} />
                            </div>
                            <span className="text-[10px] font-mono text-textMuted px-2 py-1 bg-background rounded border border-border">
                                {strategy.version || 'v1.0.0'}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-text mb-2 break-all">{strategy.name || strategy.id}</h3>
                        <p className="text-sm text-textSecondary mb-4 line-clamp-2 min-h-[40px]">
                            {strategy.description || 'No description provided for this strategy definition.'}
                        </p>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-xs text-textMuted font-mono">
                                <GitBranch size={12} />
                                <span className="truncate max-w-[200px]">{strategy.author || 'Unknown Author'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-textMuted font-mono">
                                <Terminal size={12} />
                                <span>{strategy.entrypoint || 'entrypoint.py'}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <button
                                onClick={() => setDetailsStrategy(strategy)}
                                className="text-xs font-bold text-textSecondary hover:text-text transition-colors flex items-center gap-1"
                            >
                                <Info size={12} /> DETAILS
                            </button>

                            <button
                                onClick={() => setSelectedStrategy(strategy)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary hover:text-background transition-all text-xs font-bold shadow-sm"
                            >
                                <Plus size={12} strokeWidth={3} />
                                ADD TO FLEET
                            </button>
                        </div>
                    </div>
                ))}

                {filteredStrategies.length === 0 && (
                    <div className="col-span-full py-12 text-center text-textMuted border-2 border-dashed border-border rounded-lg">
                        <p className="font-mono mb-2">NO STRATEGIES FOUND</p>
                        <p className="text-sm">Try adjusting your search or install a new strategy.</p>
                    </div>
                )}
            </div>

            {/* Install Modal */}
            {installModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-lg overflow-hidden">
                        <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-surfaceHighlight/30">
                            <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                <Download size={18} className="text-primary" />
                                INSTALL STRATEGY PACKAGE
                            </h2>
                            <button
                                onClick={() => setInstallModalOpen(false)}
                                className="text-textMuted hover:text-text transition-colors"
                            >
                                ✕
                            </button>
                        </header>

                        <div className="p-6 space-y-4">
                            {installStatus && (
                                <div className={`p-3 rounded text-sm mb-4 border ${installStatus.type === 'success'
                                    ? 'bg-statusGood/10 border-statusGood/20 text-statusGood'
                                    : 'bg-statusBad/10 border-statusBad/20 text-statusBad'
                                    }`}>
                                    <div className="flex items-start gap-2">
                                        <Info size={16} className="shrink-0 mt-0.5" />
                                        <span>{installStatus.message}</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase mb-1.5 ml-1">Git Repository URL</label>
                                <input
                                    type="text"
                                    placeholder="https://github.com/username/strategy-repo.git"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    className="w-full p-3 bg-background border border-border rounded focus:outline-none focus:border-primary text-sm font-mono"
                                    disabled={isInstalling}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase mb-1.5 ml-1">Version / Tag / Branch</label>
                                <input
                                    type="text"
                                    placeholder="main"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    className="w-full p-3 bg-background border border-border rounded focus:outline-none focus:border-primary text-sm font-mono"
                                    disabled={isInstalling}
                                />
                            </div>
                        </div>

                        <footer className="px-6 py-4 border-t border-border bg-surfaceHighlight/10 flex justify-end gap-3">
                            <button
                                onClick={() => setInstallModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-text transition-colors"
                                disabled={isInstalling}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleInstall}
                                disabled={isInstalling || !repoUrl}
                                className={`
                                    px-4 py-2 text-sm font-bold bg-primary text-background rounded transition-all
                                    ${(isInstalling || !repoUrl) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'}
                                    flex items-center gap-2
                                `}
                            >
                                {isInstalling ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                        INSTALLING...
                                    </>
                                ) : (
                                    <>
                                        INSTALL PACKAGE
                                    </>
                                )}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
            {/* Configure Instance Modal */}
            {selectedStrategy && (
                <ConfigureInstanceModal
                    strategy={selectedStrategy}
                    onClose={() => setSelectedStrategy(null)}
                    onSuccess={handleInstanceCreated}
                />
            )}

            {/* Strategy Details Modal */}
            {detailsStrategy && (
                <StrategyDetailsModal
                    strategy={detailsStrategy}
                    onClose={() => setDetailsStrategy(null)}
                />
            )}
        </div>
    );
}

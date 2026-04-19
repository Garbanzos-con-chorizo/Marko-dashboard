import React, { useState } from 'react';
import { useStrategyCatalog } from '../context/StrategyCatalogContext';
import { Package, GitBranch, Terminal, AlertCircle, Search, Info, Plus, BookOpen, Download } from 'lucide-react';
import ConfigureInstanceModal from '../components/ConfigureInstanceModal';
import StrategyDetailsModal from '../components/StrategyDetailsModal';
import InstallStrategyModal from '../components/InstallStrategyModal';

export default function Library() {
    const { strategies, loading, error: catalogError } = useStrategyCatalog();
    const [installModalOpen, setInstallModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStrategy, setSelectedStrategy] = useState(null);
    const [detailsStrategy, setDetailsStrategy] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    const privateStrategies = strategies.filter(s => (s.visibility || 'PUBLIC') === 'PRIVATE');
    const filteredStrategies = privateStrategies.filter(s =>
        String(s.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.display_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInstanceCreated = () => {
        setToastMessage("Instance created. Initializing and warming up...");
        setTimeout(() => setToastMessage(null), 5000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-textMuted font-mono animate-pulse">
                LOADING LIBRARY...
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {toastMessage && (
                <div className="fixed top-20 right-8 z-50 p-4 bg-statusGood/10 border border-statusGood/20 backdrop-blur-md rounded shadow-lg text-statusGood flex items-center gap-3 animate-slideIn">
                    <Info size={20} />
                    <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
                </div>
            )}

            <header className="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-text mb-1 flex items-center gap-2">
                        <BookOpen className="text-primary" size={24} />
                        STRATEGY LIBRARY
                    </h1>
                    <p className="text-sm font-mono text-textMuted">PRIVATE STRATEGIES ONLY</p>
                </div>
                <button
                    onClick={() => setInstallModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded font-bold hover:bg-primary/90 transition-colors"
                >
                    <Download size={16} />
                    INSTALL FROM GIT
                </button>
            </header>

            {catalogError && (
                <div className="p-4 bg-statusBad/10 border border-statusBad/20 rounded text-statusBad flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span className="font-mono text-sm">{catalogError}</span>
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
                <input
                    type="text"
                    placeholder="Search private strategies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded focus:outline-none focus:border-primary text-sm font-mono text-text placeholder:text-textMuted/50"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStrategies.map((strategy) => (
                    <div key={strategy.id} className="bg-surface border border-border p-5 rounded-lg hover:border-borderHighlight transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-surfaceHighlight rounded text-primary">
                                <Package size={24} />
                            </div>
                            <span className="text-[10px] font-mono text-textMuted px-2 py-1 bg-background rounded border border-border">
                                {strategy.version || 'v1.0.0'}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-text mb-2 break-all">{strategy.display_name || strategy.name || strategy.id}</h3>
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
                        <p className="font-mono mb-2">NO PRIVATE STRATEGIES FOUND</p>
                        <p className="text-sm">Install a private strategy or switch to Marketplace.</p>
                    </div>
                )}
            </div>

            {installModalOpen && (
                <InstallStrategyModal
                    defaultVisibility="PRIVATE"
                    onClose={() => setInstallModalOpen(false)}
                    onSuccess={() => setInstallModalOpen(false)}
                />
            )}

            {selectedStrategy && (
                <ConfigureInstanceModal
                    strategy={selectedStrategy}
                    onClose={() => setSelectedStrategy(null)}
                    onSuccess={handleInstanceCreated}
                />
            )}

            {detailsStrategy && (
                <StrategyDetailsModal
                    strategy={detailsStrategy}
                    onClose={() => setDetailsStrategy(null)}
                />
            )}
        </div>
    );
}

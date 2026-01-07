import React, { useEffect, useState } from 'react';
import { useStrategyCatalog } from '../context/StrategyCatalogContext';
import { Package, GitBranch, Terminal, Shield, List, Settings, Info, Loader2, BookOpen, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function StrategyDetailsModal({ strategy, onClose }) {
    const { fetchSchema, fetchReadme } = useStrategyCatalog();
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'docs'
    const [schema, setSchema] = useState(null);
    const [readme, setReadme] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            const [paramsData, readmeText] = await Promise.all([
                fetchSchema(strategy.id),
                fetchReadme(strategy.id)
            ]);

            if (isMounted) {
                setSchema(paramsData);
                setReadme(readmeText);
                setLoading(false);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [strategy.id, fetchSchema, fetchReadme]);

    // Custom Components for Markdown Rendering styling
    const MarkdownComponents = {
        h1: ({ node, ...props }) => <h3 className="text-lg font-bold text-primary mt-4 mb-2 border-b border-border/50 pb-1" {...props} />,
        h2: ({ node, ...props }) => <h4 className="text-base font-bold text-text mt-3 mb-2" {...props} />,
        h3: ({ node, ...props }) => <h5 className="text-sm font-bold text-textSecondary mt-2 mb-1" {...props} />,
        p: ({ node, ...props }) => <p className="text-sm text-textSecondary leading-relaxed mb-3" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 mb-3 text-sm text-textSecondary" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 mb-3 text-sm text-textSecondary" {...props} />,
        code: ({ node, inline, className, children, ...props }) => {
            return inline ?
                <code className="bg-surfaceHighlight px-1 py-0.5 rounded text-xs font-mono text-primary" {...props}>{children}</code> :
                <code className="block bg-surfaceHighlight p-3 rounded text-xs font-mono text-text overflow-x-auto my-3" {...props}>{children}</code>
        },
        table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="min-w-full text-sm text-left border border-border" {...props} /></div>,
        th: ({ node, ...props }) => <th className="bg-surfaceHighlight p-2 font-bold text-text border-b border-border" {...props} />,
        td: ({ node, ...props }) => <td className="p-2 border-b border-border/50 text-textSecondary" {...props} />,
        blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-primary pl-4 italic text-textMuted my-3" {...props} />
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                <header className="px-6 py-5 border-b border-border flex items-center justify-between bg-surfaceHighlight/30 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text mb-0.5">{strategy.name || strategy.id}</h2>
                            <p className="text-xs font-mono text-textMuted tracking-widest uppercase">
                                DEFINITION ID: {strategy.id} • {strategy.version || 'v1.0.0'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-textMuted hover:text-text hover:bg-surfaceHighlight rounded-full transition-all"
                    >
                        ✕
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex items-center gap-6 px-6 border-b border-border/50 bg-background/50 text-sm font-bold tracking-wide">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-text'}`}
                    >
                        <Info size={14} /> OVERVIEW
                    </button>
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'docs' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-text'}`}
                    >
                        <BookOpen size={14} /> DOCUMENTATION
                        {readme && <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-background/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-textMuted">
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <span className="font-mono text-xs tracking-widest">FETCHING STRATEGY PACKAGE...</span>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-fadeIn">
                                    <section>
                                        <p className="text-textSecondary text-sm leading-relaxed mb-6">
                                            {strategy.description || 'This strategy has no extended description provided. It is a custom logic package registered in the catalog.'}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-background border border-border rounded-lg">
                                                <span className="block text-[10px] text-textMuted uppercase font-bold mb-1">Author</span>
                                                <div className="flex items-center gap-2 text-sm text-text font-mono">
                                                    <GitBranch size={14} className="text-primary" />
                                                    {strategy.author || 'Internal Maintainer'}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-background border border-border rounded-lg">
                                                <span className="block text-[10px] text-textMuted uppercase font-bold mb-1">Entrypoint</span>
                                                <div className="flex items-center gap-2 text-sm text-text font-mono">
                                                    <Terminal size={14} className="text-primary" />
                                                    {strategy.entrypoint || 'main.py'}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-xs font-bold text-primary tracking-widest uppercase mb-4 flex items-center gap-2">
                                            <Shield size={14} /> CAPABILITIES & TELEMETRY
                                        </h3>
                                        {schema ? (
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="text-xs font-bold text-textSecondary uppercase mb-2 flex items-center gap-1.5 ml-1">
                                                        <List size={14} /> Metrics Provided
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {schema.telemetry_fields?.map(field => (
                                                            <span key={field} className="px-2 py-1 bg-surfaceHighlight text-textSecondary border border-border rounded text-[10px] font-mono">
                                                                {field}
                                                            </span>
                                                        )) || <span className="text-textMuted text-xs italic">Generic metrics only</span>}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-xs font-bold text-textSecondary uppercase mb-2 flex items-center gap-1.5 ml-1">
                                                        <Settings size={14} /> Default Parameters
                                                    </h4>
                                                    <div className="bg-background/50 border border-border p-3 rounded font-mono text-[11px] text-textSecondary whitespace-pre overflow-x-auto">
                                                        {schema.default_params ? JSON.stringify(schema.default_params, null, 2) : '// No specific parameters defined'}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-surfaceHighlight/50 rounded-lg text-sm text-textMuted flex items-center gap-3">
                                                <Info size={16} />
                                                No extended schema available for this strategy definition. It will use standard engine monitoring.
                                            </div>
                                        )}
                                    </section>
                                </div>
                            )}

                            {activeTab === 'docs' && (
                                <div className="space-y-4 animate-fadeIn">
                                    {readme ? (
                                        <div className="prose prose-invert max-w-none text-textSecondary">
                                            <ReactMarkdown
                                                children={readme}
                                                remarkPlugins={[remarkGfm]}
                                                components={MarkdownComponents}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-lg">
                                            <FileText size={48} className="text-textMuted mb-4 opacity-50" />
                                            <h3 className="text-lg font-bold text-textMuted">No Documentation Found</h3>
                                            <p className="text-sm text-textMuted/70 max-w-xs mt-2">
                                                The author of this strategy has not provided a README file.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <footer className="px-6 py-4 border-t border-border bg-surfaceHighlight/10 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-surfaceHighlight text-text font-bold text-sm rounded-lg hover:bg-border transition-colors uppercase tracking-wider"
                    >
                        Close Details
                    </button>
                </footer>
            </div>
        </div>
    );
}

import React, { useEffect, useState, useCallback } from 'react';
import { useStrategy } from '../context/StrategyContext';
import { api } from '../services/api';
import { Filter, RefreshCw, Terminal, Search, AlertTriangle, Info, AlertOctagon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function Events() {
    // We use strategies to populate the instance filter dropdown
    const { strategies, selectedStrategyId } = useStrategy();

    // State
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    // Filters
    const [filterLevel, setFilterLevel] = useState(''); // '' | 'INFO' | 'WARN' | 'ERROR'
    const [filterInstance, setFilterInstance] = useState(''); // '' = ALL
    const [limit] = useState(50);
    const [offset, setOffset] = useState(0);

    // Initial load: prefer selected strategy if available?
    // User might want to see global logs by default. Let's start with global (ALL).

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api.getSystemLogs({
                limit,
                offset,
                level: filterLevel || undefined,
                instance_id: filterInstance || undefined
            });

            setLogs(result.logs || []);
            setTotal(result.total || 0);
        } catch (err) {
            console.error("Failed to load logs", err);
        } finally {
            setLoading(false);
        }
    }, [limit, offset, filterLevel, filterInstance]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Handle pagination
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    const nextPage = () => {
        if (currentPage < totalPages) setOffset(offset + limit);
    };

    const prevPage = () => {
        if (currentPage > 1) setOffset(Math.max(0, offset - limit));
    };

    // Color helpers
    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR': return 'text-statusBad bg-statusBad/10 border-statusBad/20';
            case 'WARN': return 'text-statusWarn bg-statusWarn/10 border-statusWarn/20';
            case 'INFO': return 'text-primary bg-primary/10 border-primary/20';
            default: return 'text-textMuted bg-surfaceHighlight border-border';
        }
    };

    const getIcon = (level) => {
        switch (level) {
            case 'ERROR': return <AlertOctagon size={14} />;
            case 'WARN': return <AlertTriangle size={14} />;
            case 'INFO': return <Info size={14} />;
            default: return <Terminal size={14} />;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Header / Toolbar */}
            <header className="flex flex-col gap-4 mb-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-text mb-1">SYSTEM LOGS</h1>
                        <p className="text-sm font-mono text-textMuted">REAL-TIME ENGINE EVENT STREAM</p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className={`p-2 rounded-full hover:bg-surfaceHighlight transition-all ${loading ? 'animate-spin text-primary' : 'text-textMuted'}`}
                        title="Refresh Logs"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-wrap items-center gap-3 p-3 bg-surface border border-border rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 text-textSecondary text-sm font-bold tracking-wide mr-2">
                        <Filter size={14} /> FILTERS
                    </div>

                    {/* Instance Selector */}
                    <select
                        value={filterInstance}
                        onChange={(e) => { setFilterInstance(e.target.value); setOffset(0); }}
                        className="bg-background border border-border rounded px-3 py-1.5 text-sm md:min-w-[180px] focus:outline-none focus:border-primary"
                    >
                        <option value="">All Instances</option>
                        {strategies.map(s => (
                            <option key={s.id} value={s.id}>{s.id}</option>
                        ))}
                    </select>

                    {/* Level Selector */}
                    <div className="flex items-center bg-background border border-border rounded overflow-hidden">
                        {['', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => { setFilterLevel(lvl); setOffset(0); }}
                                className={`px-3 py-1.5 text-xs font-bold font-mono transition-colors ${filterLevel === lvl
                                        ? 'bg-primary text-background'
                                        : 'hover:bg-surfaceHighlight text-textMuted hover:text-text'
                                    } border-r border-border last:border-0`}
                            >
                                {lvl || 'ALL'}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto text-xs font-mono text-textMuted hidden sm:block">
                        Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
                    </div>
                </div>
            </header>

            {/* Log Console Container */}
            <div className="flex-1 min-h-0 bg-black/40 border border-border rounded-lg overflow-hidden flex flex-col backdrop-blur-sm">

                {/* Header Row */}
                <div className="flex items-center px-4 py-2 bg-surfaceHighlight/50 border-b border-border text-[10px] font-mono font-bold text-textMuted uppercase tracking-wider">
                    <div className="w-32 md:w-48 shrink-0">Timestamp</div>
                    <div className="w-20 shrink-0 text-center">Level</div>
                    <div className="w-24 md:w-32 shrink-0 hidden md:block">Module</div>
                    <div className="w-24 md:w-32 shrink-0 hidden sm:block">Instance</div>
                    <div className="flex-1">Message</div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs">
                    {loading && logs.length === 0 ? (
                        // Initial Load Skeleton
                        <div className="flex flex-col items-center justify-center h-full text-textMuted gap-2">
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <span>Fetching logs...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-textMuted">
                            <Terminal size={48} className="opacity-20 mb-4" />
                            <p>No logs found matching your criteria.</p>
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={`${log.timestamp}-${i}`} className="flex items-start md:items-center px-4 py-2 hover:bg-surfaceHighlight/20 border-b border-border/30 last:border-0 transition-colors group">
                                <span className="w-32 md:w-48 shrink-0 text-textMuted opacity-70">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    <span className="text-[9px] ml-1 opacity-50 hidden md:inline">.{new Date(log.timestamp).getMilliseconds()}</span>
                                </span>

                                <div className="w-20 shrink-0 flex justify-center">
                                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold border ${getLevelColor(log.level)}`}>
                                        {getIcon(log.level)}
                                        {log.level}
                                    </span>
                                </div>

                                <div className="w-24 md:w-32 shrink-0hidden md:block text-textSecondary opacity-80 truncate px-2 hidden md:block">
                                    {log.module || '-'}
                                </div>

                                <div className="w-24 md:w-32 shrink-0 text-primary opacity-80 truncate px-2 hidden sm:block" title={log.instance_id}>
                                    {log.instance_id || 'SYSTEM'}
                                </div>

                                <div className={`flex-1 break-words pl-2 ${log.level === 'ERROR' ? 'text-statusBad' : 'text-textSecondary group-hover:text-text'}`}>
                                    {log.message}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="px-4 py-2 border-t border-border bg-surfaceHighlight/30 flex items-center justify-between shrink-0">
                    <span className="text-xs text-textMuted font-mono">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={prevPage}
                            disabled={currentPage === 1 || loading}
                            className="p-1.5 rounded hover:bg-surfaceHighlight text-textSecondary disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={nextPage}
                            disabled={currentPage >= totalPages || loading}
                            className="p-1.5 rounded hover:bg-surfaceHighlight text-textSecondary disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

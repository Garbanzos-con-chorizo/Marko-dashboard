import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useStrategy } from '../context/StrategyContext';
import { NavLink } from 'react-router-dom';
import StrategySelector from './StrategySelector';
import {
    LayoutDashboard,
    Cpu,
    Layers,
    ScrollText,
    ChevronLeft,
    ChevronRight,
    Activity,
    Globe,
    Package
} from 'lucide-react';

// eslint-disable-next-line no-unused-vars
const SidebarLink = ({ to, label, icon: Icon, isCollapsed }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `
            flex items-center gap-3 px-3 py-3 mx-2 rounded-md transition-all duration-200
            ${isActive
                ? 'bg-surfaceHighlight text-text border-l-2 border-primary'
                : 'text-textSecondary hover:bg-surfaceHighlight/50 hover:text-text'
            }
            ${isActive && !isCollapsed ? 'pl-2' : ''}
            ${isCollapsed ? 'justify-center' : ''}
        `}
        title={isCollapsed ? label : ''}
    >
        <Icon size={20} className="shrink-0" />
        {!isCollapsed && (
            <span className="text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden">
                {label}
            </span>
        )}
    </NavLink>
);

export default function Layout({ children }) {
    const { lastUpdated, error } = useTelemetry();
    const { strategies, selectedStrategyId, selectStrategy } = useStrategy();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Auto-collapse on mobile devices on mount
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsCollapsed(true);
            }
        };

        // Initial check
        handleResize();

        // Optional: listen to resize events, though might be annoying if resizing window on desktop
        // window.addEventListener('resize', handleResize);
        // return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-text font-sans">
            {/* Sidebar */}
            <aside
                className={`
                    flex flex-col border-r border-border bg-surface transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w[60px]' : 'w-[240px]'}
                    shrink-0 relative
                `}
                // Tailwind v4 specific width handling if needed, but standard w- works
                style={{ width: isCollapsed ? '64px' : '240px' }}
            >
                {/* Header */}
                <div className={`
                    h-[60px] flex items-center border-b border-border overflow-hidden
                    ${isCollapsed ? 'justify-center px-0' : 'px-6'}
                `}>
                    <div className="flex items-center gap-2 text-primary">
                        <div className="w-3 h-3 bg-primary rounded-[2px] shrink-0"></div>
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <h1 className="text-sm font-bold tracking-wider text-text">MARKO V4</h1>
                                <span className="text-[9px] text-textMuted leading-none">ALGORITHMIC TRADING</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Strategy Selector (Only if expanded and we have strategies) */}
                {!isCollapsed && strategies.length > 0 && (
                    <div className="px-4 py-3 border-b border-border">
                        <StrategySelector
                            strategies={strategies}
                            selectedStrategyId={selectedStrategyId}
                            onSelect={selectStrategy}
                        />
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
                    <SidebarLink to="/strategies" label="STRATEGIES" icon={Globe} isCollapsed={isCollapsed} />
                    <SidebarLink to="/marketplace" label="MARKETPLACE" icon={Package} isCollapsed={isCollapsed} />
                    <SidebarLink to="/overview" label="OVERVIEW" icon={LayoutDashboard} isCollapsed={isCollapsed} />
                    <SidebarLink to="/strategy" label="STRATEGY" icon={Cpu} isCollapsed={isCollapsed} />
                    <SidebarLink to="/positions" label="POSITIONS" icon={Layers} isCollapsed={isCollapsed} />
                    <SidebarLink to="/events" label="EVENTS / LOGS" icon={ScrollText} isCollapsed={isCollapsed} />
                </nav>

                {/* Footer / Status */}
                <div className="p-3 border-t border-border bg-surface text-[10px]">
                    {!isCollapsed ? (
                        <>
                            <div className="text-textMuted mb-1 font-medium">STATUS</div>
                            {error ? (
                                <div className="flex items-center gap-2 text-statusBad font-medium">
                                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                                    <span>API ERROR</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-statusGood font-medium">
                                    <span className="w-2 h-2 rounded-full bg-current"></span>
                                    <span>SYSTEM ONLINE</span>
                                </div>
                            )}
                            <div className="mt-2 text-textMuted font-mono">
                                UP: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div
                                className={`w-2 h-2 rounded-full ${error ? 'bg-statusBad animate-pulse' : 'bg-statusGood'}`}
                                title={error ? 'API Error' : 'System Online'}
                            />
                            <Activity size={14} className="text-textMuted op-50" />
                        </div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-16 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center text-textSecondary hover:text-primary transition-colors cursor-pointer z-10 shadow-sm"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-background relative flex flex-col">
                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border-b border-statusBad text-statusBad px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2">
                        <Activity size={14} />
                        <span>CONNECTION LOST. DISPLAYING STALE DATA.</span>
                    </div>
                )}

                <div className="flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

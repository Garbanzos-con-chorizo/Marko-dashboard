/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useStrategy } from './StrategyContext';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
    // Access strategy context to get current selection
    const { selectedStrategyId } = useStrategy();

    // Keep a ref to the current ID so the poller always sees the fresh value
    const strategyIdRef = useRef(selectedStrategyId);
    useEffect(() => {
        strategyIdRef.current = selectedStrategyId;
    }, [selectedStrategyId]);

    const [telemetry, setTelemetry] = useState({
        status: null,
        strategy: null,
        positions: [],
        events: [],
    });
    const [chartData, setChartData] = useState(null);
    const [selectedChartSymbol, setSelectedChartSymbol] = useState(null);
    const chartSymbolRef = useRef(selectedChartSymbol);
    useEffect(() => {
        chartSymbolRef.current = selectedChartSymbol;
    }, [selectedChartSymbol]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartError, setChartError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const lastTelemetryFetchRef = useRef(0);
    const lastChartFetchRef = useRef(0);
    const minFetchIntervalMs = 2000;

    // Default to 100 bars
    const [barsLimit, setBarsLimit] = useState(100);

    // --- Cancellation plumbing ---
    // isMounted: true for the full lifetime of the provider. Flipped to
    // false only when the provider itself unmounts.
    const isMounted = useRef(true);
    // activeController: AbortController for the *current* poll cycle. Replaced
    // whenever the effect re-runs (strategy switch, limit change, unmount),
    // which aborts any in-flight requests so their late responses cannot
    // write into state for a stale strategy.
    const activeControllerRef = useRef(null);

    // Fetch functions — parameterized by the controller from the owning effect
    // so a manual refresh while a switch is in flight still targets the right
    // controller.
    const fetchTelemetryData = useCallback(async (controller) => {
        const signal = controller?.signal;
        try {
            const now = Date.now();
            if (now - lastTelemetryFetchRef.current < minFetchIntervalMs) {
                return;
            }
            lastTelemetryFetchRef.current = now;
            const currentId = strategyIdRef.current;

            const telemetryData = await api.getTelemetry(currentId, { signal });

            if (!isMounted.current || signal?.aborted) return;

            // Check warmup state
            if (telemetryData.status?.is_warming_up) {
                setTelemetry(telemetryData);
                setLoading(false);
                setError(null);
                setLastUpdated(new Date());
                return;
            }

            // Normal operation - all data already transformed
            setTelemetry(telemetryData);
            setError(null);
            setLastUpdated(new Date());
            setLoading(false);
        } catch (err) {
            if (err?.name === 'AbortError') return; // expected on switch/unmount
            if (!isMounted.current) return;
            console.error('Telemetry Fetch Error:', err);
            setError(err.message || 'Failed to fetch telemetry');
            setLoading(false);
        }
    }, []);

    const fetchChartDataManual = useCallback(async (controller) => {
        const signal = controller?.signal;
        try {
            const now = Date.now();
            if (now - lastChartFetchRef.current < minFetchIntervalMs) {
                return;
            }
            lastChartFetchRef.current = now;
            const currentId = strategyIdRef.current;

            const data = await api.getChartData(currentId, barsLimit, chartSymbolRef.current, { signal });

            if (!isMounted.current || signal?.aborted) return;

            setChartData(data);
            setChartError(null);
            if (data?.available_symbols && Array.isArray(data.available_symbols)) {
                if (!selectedChartSymbol || !data.available_symbols.includes(selectedChartSymbol)) {
                    setSelectedChartSymbol(data.symbol || data.available_symbols[0] || null);
                }
            }
        } catch (err) {
            if (err?.name === 'AbortError') return;
            if (!isMounted.current) return;
            console.error('Chart Fetch Error:', err);
            setChartError(err.message || 'Failed to fetch chart data');
        }
    }, [barsLimit, selectedChartSymbol]);

    // Effect to handle strategy changes, limit changes, and polling
    useEffect(() => {
        // New poll cycle — spin up a fresh controller and tear down the old one.
        const controller = new AbortController();
        activeControllerRef.current?.abort();
        activeControllerRef.current = controller;

        // Show loading when switching strategies or limits, but keep last data to avoid blanks
        setLoading(true);
        setSelectedChartSymbol(null);
        setError(null);
        setChartError(null);
        // Reset throttles so the first fetch of a new strategy isn't skipped
        lastTelemetryFetchRef.current = 0;
        lastChartFetchRef.current = 0;

        const pollInterval = 5000;

        // Initial fetch
        fetchTelemetryData(controller);
        fetchChartDataManual(controller);

        // Set up polling
        const intervalId = setInterval(() => {
            if (controller.signal.aborted) return;
            fetchTelemetryData(controller);
            fetchChartDataManual(controller);
        }, pollInterval);

        return () => {
            clearInterval(intervalId);
            controller.abort();
        };
    }, [selectedStrategyId, barsLimit, fetchTelemetryData, fetchChartDataManual]);

    // Lifetime cleanup — only flips isMounted on true unmount of the provider.
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            activeControllerRef.current?.abort();
        };
    }, []);

    // Public manual-refresh wrappers target the current cycle's controller
    const refreshTelemetry = useCallback(
        () => fetchTelemetryData(activeControllerRef.current),
        [fetchTelemetryData]
    );
    const refreshChart = useCallback(
        () => fetchChartDataManual(activeControllerRef.current),
        [fetchChartDataManual]
    );

    const value = {
        data: telemetry,
        chartData,
        loading,
        error,
        chartError,
        lastUpdated,
        refreshTelemetry,
        refreshChart,
        barsLimit,
        setBarsLimit,
        selectedChartSymbol,
        setSelectedChartSymbol
    };

    return (
        <TelemetryContext.Provider value={value}>
            {children}
        </TelemetryContext.Provider>
    );
};

export const useTelemetry = () => {
    const context = useContext(TelemetryContext);
    if (!context) {
        throw new Error('useTelemetry must be used within a TelemetryProvider');
    }
    return context;
};

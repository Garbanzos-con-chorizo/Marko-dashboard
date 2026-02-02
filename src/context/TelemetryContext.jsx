/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { useStrategy } from './StrategyContext';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
    // Access strategy context to get current selection
    const { selectedStrategyId } = useStrategy();

    // Keep a ref to the current ID so the poller always sees the fresh value
    // (even if the interval closure is somehow stale)
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

    // Improve polling consistency with a ref to track mounting
    const isMounted = useRef(true);

    // Fetch functions exposed for manual refresh
    const fetchTelemetryData = async () => {
        try {
            const now = Date.now();
            if (now - lastTelemetryFetchRef.current < minFetchIntervalMs) {
                return;
            }
            lastTelemetryFetchRef.current = now;
            // Always use the freshest ID from the Ref
            const currentId = strategyIdRef.current;
            // console.log('[TelemetryContext] Polling Telemetry for ID:', currentId);

            // Pass currentId to api
            const telemetryData = await api.getTelemetry(currentId);

            // Check warmup state
            if (telemetryData.status?.is_warming_up) {
                if (isMounted.current) {
                    setTelemetry(telemetryData);
                    setLoading(false);
                    setError(null);
                    setLastUpdated(new Date());
                }
                return;
            }

            // Normal operation - all data already transformed
            if (isMounted.current) {
                setTelemetry(telemetryData);
                setError(null);
                setLastUpdated(new Date());
            }
        } catch (err) {
            if (isMounted.current) {
                console.error('Telemetry Fetch Error:', err);
                setError(err.message || 'Failed to fetch telemetry');
            }
        } finally {
            if (isMounted.current) {
                // Only unset loading if we have some data or error
                setLoading(false);
            }
        }
    };

    const fetchChartDataManual = async () => {
        try {
            const now = Date.now();
            if (now - lastChartFetchRef.current < minFetchIntervalMs) {
                return;
            }
            lastChartFetchRef.current = now;
            // Always use the freshest ID from the Ref
            const currentId = strategyIdRef.current;

            // Pass currentId and limit to api
            const data = await api.getChartData(currentId, barsLimit, chartSymbolRef.current);
            if (isMounted.current) {
                setChartData(data);
                setChartError(null);
                if (data?.available_symbols && Array.isArray(data.available_symbols)) {
                    if (!selectedChartSymbol || !data.available_symbols.includes(selectedChartSymbol)) {
                        setSelectedChartSymbol(data.symbol || data.available_symbols[0] || null);
                    }
                }
            }
        } catch (err) {
            if (isMounted.current) {
                console.error('Chart Fetch Error:', err);
                setChartError(err.message || 'Failed to fetch chart data');
            }
        }
    };

    // Effect to handle strategy changes, limit changes, and polling
    useEffect(() => {
        isMounted.current = true;
        setLoading(true); // Show loading when switching strategies or limits
        setTelemetry({
            status: null,
            strategy: null,
            positions: [],
            events: [],
        });
        setChartData(null);
        setSelectedChartSymbol(null);
        setError(null);
        setChartError(null);
        setLastUpdated(null);

        // Use a faster poll interval for telemetry (e.g., 5s) instead of 14m
        const pollInterval = 5000;

        // Initial fetch
        fetchTelemetryData();
        fetchChartDataManual();

        // Set up polling
        const intervalId = setInterval(() => {
            fetchTelemetryData();
            fetchChartDataManual();
        }, pollInterval);

        return () => {
            clearInterval(intervalId);
        };
    }, [selectedStrategyId, barsLimit]);

    // Proper cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const value = {
        data: telemetry,
        chartData,
        loading,
        error,
        chartError,
        lastUpdated,
        refreshTelemetry: fetchTelemetryData,
        refreshChart: fetchChartDataManual,
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

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { api } from '../services/api';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
    const [telemetry, setTelemetry] = useState({
        status: null,
        strategy: null,
        positions: [],
        events: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Improve polling consistency with a ref to track mounting
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const pollInterval = 3000; // 3 seconds

        const fetchData = async () => {
            try {
                // 1. Always poll status first
                const statusData = await api.getStatus();

                if (statusData.is_warming_up) {
                    if (isMounted.current) {
                        setTelemetry(prev => ({ ...prev, status: statusData }));
                        setLoading(false);
                        setError(null);
                        setLastUpdated(new Date());
                    }
                    return; // Skip other polls during warmup
                }

                // 2. Poll the rest only if ready
                const [strategyData, positionsData, eventsData] = await Promise.all([
                    api.getStrategy(),
                    api.getPositions(),
                    api.getEvents(),
                ]);

                if (isMounted.current) {
                    setTelemetry({
                        status: statusData,
                        strategy: strategyData,
                        positions: positionsData,
                        events: eventsData,
                    });
                    setError(null);
                    setLastUpdated(new Date());
                }
            } catch (err) {
                if (isMounted.current) {
                    console.error('Telemetry Fetch Error:', err);
                    setError(err.message || 'Failed to fetch telemetry');
                    // Start showing stale data indicator if needed (handled by UI via lastUpdated)
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        };

        // Initial fetch
        fetchData();

        // Set up polling
        const intervalId = setInterval(fetchData, pollInterval);

        return () => {
            isMounted.current = false;
            clearInterval(intervalId);
        };
    }, []);

    const value = {
        data: telemetry,
        loading,
        error,
        lastUpdated,
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

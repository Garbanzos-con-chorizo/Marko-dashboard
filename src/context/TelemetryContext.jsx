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
                // Single telemetry call
                const telemetryData = await api.getTelemetry();

                // Check warmup state
                if (telemetryData.status?.is_warming_up) {
                    if (isMounted.current) {
                        setTelemetry(telemetryData);
                        setLoading(false);
                        setError(null);
                        setLastUpdated(new Date());
                    }
                    return; // Skip further processing during warmup
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

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
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartError, setChartError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Improve polling consistency with a ref to track mounting
    const isMounted = useRef(true);

    // Fetch functions exposed for manual refresh
    const fetchTelemetryData = async () => {
        try {
            const telemetryData = await api.getTelemetry();

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
                setLoading(false);
            }
        }
    };

    const fetchChartDataManual = async () => {
        try {
            const data = await api.getChartData();
            if (isMounted.current) {
                setChartData(data);
                setChartError(null);
            }
        } catch (err) {
            if (isMounted.current) {
                console.error('Chart Fetch Error:', err);
                setChartError(err.message || 'Failed to fetch chart data');
            }
        }
    };

    useEffect(() => {
        isMounted.current = true;
        const pollInterval = 840000; // 14 minutes

        // Initial fetch
        fetchTelemetryData();

        // Set up polling
        const intervalId = setInterval(fetchTelemetryData, pollInterval);

        return () => {
            isMounted.current = false;
            clearInterval(intervalId);
        };
    }, []);

    // Separate polling for chart data (less frequent)
    useEffect(() => {
        const chartPollInterval = 840000; // 14 minutes
        let chartIntervalId;

        // Initial fetch
        fetchChartDataManual();

        // Set up polling
        chartIntervalId = setInterval(fetchChartDataManual, chartPollInterval);

        return () => {
            if (chartIntervalId) {
                clearInterval(chartIntervalId);
            }
        };
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

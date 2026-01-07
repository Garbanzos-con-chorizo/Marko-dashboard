
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

const StrategyContext = createContext(null);

export const StrategyProvider = ({ children }) => {
    const [strategies, setStrategies] = useState([]);
    const [selectedStrategyId, setSelectedStrategyId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMounted = useRef(true);

    const fetchStrategies = useCallback(async () => {
        try {
            const list = await api.getStrategies();
            if (isMounted.current) {
                setStrategies(list || []);
                setError(null);

                // Auto-select primary tactic:
                // If nothing is selected, select the first one.
                // If the previously selected one is gone, select the first one.
                // If the list is empty, we might be in legacy mode (handled elsewhere) or just empty.
                if (list && list.length > 0) {
                    setSelectedStrategyId(prev => {
                        // If we already have a selection that exists in the new list, keep it.
                        if (prev && list.find(s => s.id === prev)) {
                            return prev;
                        }
                        // Otherwise default to the first one.
                        return list[0].id;
                    });
                }
            }
        } catch (err) {
            if (isMounted.current) {
                console.error("Failed to fetch strategies:", err);
                // Don't set global error to block UI, just log it.
                // Strategies might fail if backend is V1 only?
                // If V1 only, api.getStrategies might 404.
                // In that case, we keep strategies empty and selectedStrategyId null.
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []);

    // Initial fetch and poll
    useEffect(() => {
        isMounted.current = true;
        fetchStrategies();

        const intervalId = setInterval(fetchStrategies, 5000);

        return () => {
            isMounted.current = false;
            clearInterval(intervalId);
        };
    }, [fetchStrategies]);

    const selectStrategy = (id) => {
        if (strategies.find(s => s.id === id)) {
            setSelectedStrategyId(id);
        }
    };

    const handleControlStrategy = async (id, action) => {
        // 1. Optimistic Update: Immediately set the status in UI to feel responsive
        const previousStrategies = [...strategies];
        setStrategies(current =>
            current.map(s => {
                if (s.id === id) {
                    let newStatus = s.status;
                    if (action === 'start') newStatus = 'RUNNING';
                    if (action === 'stop') newStatus = 'STOPPED';
                    if (action === 'pause') newStatus = 'PAUSED'; // Assuming 'PAUSED' is a valid state or maps to STOPPED
                    return { ...s, status: newStatus };
                }
                return s;
            })
        );

        try {
            console.log(`[StrategyContext] Sending ${action} command for ${id}...`);
            await api.controlStrategy(id, action);

            // 2. Fetch latest truth from server to confirm
            // We wait a tiny bit to allow the backend to propagate the change
            setTimeout(() => {
                fetchStrategies();
            }, 200);

            return { success: true };
        } catch (err) {
            console.error(`[StrategyContext] Control failed:`, err);

            // 3. Rollback on failure
            setStrategies(previousStrategies);
            return { success: false, error: err.message };
        }
    };

    const value = {
        strategies,
        selectedStrategyId,
        selectStrategy,
        controlStrategy: handleControlStrategy,
        refreshStrategies: fetchStrategies,
        loading,
        error
    };

    return (
        <StrategyContext.Provider value={value}>
            {children}
        </StrategyContext.Provider>
    );
};

export const useStrategy = () => {
    const context = useContext(StrategyContext);
    if (!context) {
        throw new Error('useStrategy must be used within a StrategyProvider');
    }
    return context;
};

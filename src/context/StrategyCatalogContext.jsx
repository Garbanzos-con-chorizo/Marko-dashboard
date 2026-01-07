/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { strategyCatalogService } from '../services/strategyCatalogService';

const StrategyCatalogContext = createContext(null);

export const StrategyCatalogProvider = ({ children }) => {
    const [strategies, setStrategies] = useState([]); // Definitions
    const [schemas, setSchemas] = useState(new Map()); // id -> schema
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isMounted = useRef(true);

    // Fetch definitions on mount
    useEffect(() => {
        const initCatalog = async () => {
            try {
                // Non-blocking fetch
                console.log('[StrategyCatalog] Initializing catalog...');
                const data = await strategyCatalogService.getStrategyDefinitions();

                if (isMounted.current) {
                    // Defensive check: ensure data is an array
                    let safeData = [];
                    if (Array.isArray(data)) {
                        safeData = data;
                    } else if (data && Array.isArray(data.strategies)) {
                        safeData = data.strategies;
                    } else {
                        console.warn('[StrategyCatalog] Expected array but got:', typeof data);
                    }

                    setStrategies(safeData);
                    console.log(`[StrategyCatalog] Loaded ${safeData.length} definitions.`);
                }
            } catch (err) {
                if (isMounted.current) {
                    console.warn('[StrategyCatalog] Failed to load catalog (Phase 1 safe mode):', err);
                    setError(err.message);
                    // We do NOT block the app or show a visible error in Phase 1
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        };

        initCatalog();

        return () => {
            isMounted.current = false;
        };
    }, []);

    // Lazy load schema for a specific strategy
    const fetchSchema = useCallback(async (strategyId) => {
        if (schemas.has(strategyId)) return schemas.get(strategyId);

        try {
            const schema = await strategyCatalogService.getTelemetrySchema(strategyId);
            if (isMounted.current && schema) {
                setSchemas(prev => new Map(prev).set(strategyId, schema));
            }
            return schema;
        } catch (err) {
            console.warn(`[StrategyCatalog] Failed to load schema for ${strategyId}`, err);
            return null;
        }
    }, [schemas]);

    const value = {
        strategies,
        schemas,
        loading,
        error,
        fetchSchema
    };

    return (
        <StrategyCatalogContext.Provider value={value}>
            {children}
        </StrategyCatalogContext.Provider>
    );
};

export const useStrategyCatalog = () => {
    const context = useContext(StrategyCatalogContext);
    if (!context) {
        throw new Error('useStrategyCatalog must be used within a StrategyCatalogProvider');
    }
    return context;
};

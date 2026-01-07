
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// In-memory cache
const cache = {
    definitions: null,
    schemas: new Map(),
    lastFetch: 0
};

const CACHE_TTL = 300000; // 5 minutes

/**
 * Fetch all strategy definitions from the catalog.
 * GET /api/v2/catalog/strategies
 */
async function getStrategyDefinitions(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cache.definitions && (now - cache.lastFetch < CACHE_TTL)) {
        return cache.definitions;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v2/catalog/strategies`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Catalog API Error: ${response.status}`);
        }

        const data = await response.json();
        cache.definitions = data;
        cache.lastFetch = now;
        return data;

    } catch (error) {
        console.error('Failed to fetch strategy definitions:', error);
        throw error;
    }
}

/**
 * Fetch telemetry schema for a specific strategy definition.
 * GET /api/v2/catalog/strategies/{id}/schema
 */
async function getTelemetrySchema(id) {
    if (cache.schemas.has(id)) {
        return cache.schemas.get(id);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v2/catalog/strategies/${id}/schema`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Schema API Error for ${id}: ${response.status}`);
        }

        const schema = await response.json();
        cache.schemas.set(id, schema);
        return schema;

    } catch (error) {
        console.error(`Failed to fetch schema for ${id}:`, error);
        // Don't throw, just return null so UI handles "no schema" gracefully
        return null;
    }
}

export const strategyCatalogService = {
    getStrategyDefinitions,
    getTelemetrySchema
};

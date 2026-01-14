
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

async function installStrategy(repositoryUrl, version = 'main') {
    if (IS_MOCK) {
        console.log(`[MOCK] Installing strategy from ${repositoryUrl} @ ${version}`);
        await new Promise(r => setTimeout(r, 1000));
        return { success: true, message: 'Strategy installed successfully (MOCK)' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v2/admin/strategies/install`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                repository_url: repositoryUrl,
                version: version
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Install Failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to install strategy:', error);
        throw error;
    }
}

async function createInstance(strategyId, config) {
    if (IS_MOCK) {
        console.log(`[MOCK] Creating instance for ${strategyId}`, config);
        await new Promise(r => setTimeout(r, 800));
        return { success: true, message: 'Instance created (MOCK). Restart required.' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v2/admin/instances`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                strategy_id: strategyId,
                instance_id: config.instanceId,
                symbol: config.symbol,
                timeframe: config.timeframe,
                params: config.params || {},
                broker_config: config.broker_config || null // NEW: Dynamic Broker Config
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Create Failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to create instance:', error);
        throw error;
    }
}

async function deleteInstance(instanceId) {
    if (IS_MOCK) {
        console.log(`[MOCK] Deleting instance ${instanceId}`);
        await new Promise(r => setTimeout(r, 800));
        return { success: true, message: 'Instance deleted (MOCK). Restart required.' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v2/admin/instances/${instanceId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Delete Failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to delete instance:', error);
        throw error;
    }
}


export const adminService = {
    installStrategy,
    createInstance,
    deleteInstance
};

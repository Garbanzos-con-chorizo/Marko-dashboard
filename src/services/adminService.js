
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

export const adminService = {
    installStrategy
};

const TOKEN_STORAGE_KEY = 'marko_access_token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function getAccessToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAccessToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
}

export function getAuthHeaders() {
    const token = getAccessToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

function decodeJwtPayload(token) {
    try {
        const payload = token.split('.')[1];
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(normalized);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function isLocalToken(token) {
    const payload = decodeJwtPayload(token);
    return payload?.iss === 'marko-local';
}

export async function loginLocal(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed');
    }
    return await response.json();
}

export async function registerLocal(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Registration failed');
    }
    return await response.json();
}

export async function fetchLocalProfile() {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { ...getAuthHeaders() }
    });
    if (!response.ok) {
        throw new Error('Failed to load profile');
    }
    return await response.json();
}

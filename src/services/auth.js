const TOKEN_STORAGE_KEY = 'marko_access_token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const OIDC_CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID || '';
const OIDC_REDIRECT_URI = import.meta.env.VITE_OIDC_REDIRECT_URI || '';
const OIDC_SCOPE = import.meta.env.VITE_OIDC_SCOPE || 'openid profile email';
const OIDC_BACKEND_EXCHANGE = import.meta.env.VITE_OIDC_BACKEND_EXCHANGE === 'true';

export function useBackendOidcExchange() {
    return OIDC_BACKEND_EXCHANGE;
}

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

function generateState() {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function startOidcLogin() {
    if (!OIDC_CLIENT_ID || !OIDC_REDIRECT_URI) {
        throw new Error('Missing OIDC client configuration');
    }
    const state = generateState();
    localStorage.setItem('marko_oidc_state', state);
    const params = new URLSearchParams({
        client_id: OIDC_CLIENT_ID,
        redirect_uri: OIDC_REDIRECT_URI,
        response_type: 'code',
        scope: OIDC_SCOPE,
        state
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function completeOidcLogin(code, state) {
    const expected = localStorage.getItem('marko_oidc_state');
    if (!expected || expected !== state) {
        throw new Error('Invalid login state');
    }
    localStorage.removeItem('marko_oidc_state');
    const response = await fetch(`${API_BASE_URL}/api/auth/oidc/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code,
            redirect_uri: OIDC_REDIRECT_URI
        })
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'OIDC exchange failed');
    }
    return await response.json();
}

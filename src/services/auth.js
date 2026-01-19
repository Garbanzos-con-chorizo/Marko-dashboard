const TOKEN_STORAGE_KEY = 'marko_access_token';

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

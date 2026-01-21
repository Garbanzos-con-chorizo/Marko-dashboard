import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { userManager, oidcConfigValid } from '../auth/oidc';
import {
    setAccessToken,
    getAccessToken,
    isLocalToken,
    fetchLocalProfile,
    startOidcLogin,
    useBackendOidcExchange,
    onAuthChange
} from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const syncFromToken = async (token) => {
            const localToken = token && isLocalToken(token);
            const maxAttempts = token ? 8 : 1;
            const reloadOnce = () => {
                if (!token) return false;
                if (sessionStorage.getItem('marko_auth_reload')) {
                    return false;
                }
                sessionStorage.setItem('marko_auth_reload', '1');
                window.location.reload();
                return true;
            };

            if (localToken) {
                let profile = null;
                for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
                    try {
                        profile = await fetchLocalProfile();
                        break;
                    } catch {
                        await sleep(500 * (attempt + 1));
                    }
                }
                if (!mounted) return;
                if (profile) {
                    setUser({ profile, access_token: token, is_local: true });
                    sessionStorage.removeItem('marko_auth_reload');
                    setLoading(false);
                    return;
                }
                if (reloadOnce()) {
                    return;
                }
                setAccessToken(null);
                setUser(null);
                setLoading(false);
                return;
            }

            if (!oidcConfigValid || !userManager) {
                if (!mounted) return;
                setUser(null);
                setAccessToken(null);
                setLoading(false);
                return;
            }

            if (token) {
                setUser(prev => prev || { access_token: token });
            }

            let currentUser = null;
            for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
                try {
                    currentUser = await userManager.getUser();
                } catch {
                    currentUser = null;
                }
                if (currentUser) break;
                await sleep(500 * (attempt + 1));
            }
            if (!mounted) return;
            if (currentUser) {
                setUser(currentUser);
            } else if (!token) {
                setUser(null);
            }
            if (currentUser?.access_token) {
                setAccessToken(currentUser.access_token);
                sessionStorage.removeItem('marko_auth_reload');
            }
            if (!currentUser && !token) {
                if (reloadOnce()) {
                    return;
                }
                setAccessToken(null);
            }
            setLoading(false);
        };

        const onUserLoaded = loadedUser => {
            setUser(loadedUser);
            setAccessToken(loadedUser?.access_token || null);
        };
        const onUserUnloaded = () => {
            setUser(null);
            setAccessToken(null);
        };

        if (userManager) {
            userManager.events.addUserLoaded(onUserLoaded);
            userManager.events.addUserUnloaded(onUserUnloaded);
        }

        const unsubscribe = onAuthChange((token) => {
            if (!mounted) return;
            setLoading(true);
            syncFromToken(token);
        });

        syncFromToken(getAccessToken());

        return () => {
            mounted = false;
            if (userManager) {
                userManager.events.removeUserLoaded(onUserLoaded);
                userManager.events.removeUserUnloaded(onUserUnloaded);
            }
            unsubscribe();
        };
    }, []);

    const login = () => {
        if (useBackendOidcExchange()) {
            return startOidcLogin();
        }
        if (userManager) {
            return userManager.signinRedirect();
        }
        return null;
    };
    const logout = () => {
        if (user?.is_local) {
            setAccessToken(null);
            setUser(null);
            return null;
        }
        if (userManager) {
            return userManager.signoutRedirect();
        }
        return null;
    };

    const value = useMemo(() => ({
        user,
        loading,
        login,
        logout
    }), [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { userManager, oidcConfigValid } from '../auth/oidc';
import { setAccessToken } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        if (!oidcConfigValid || !userManager) {
            setUser(null);
            setAccessToken(null);
            setLoading(false);
            return () => { mounted = false; };
        }

        userManager.getUser().then(currentUser => {
            if (!mounted) return;
            setUser(currentUser || null);
            setAccessToken(currentUser?.access_token || null);
            setLoading(false);
        }).catch(() => {
            if (!mounted) return;
            setUser(null);
            setAccessToken(null);
            setLoading(false);
        });

        const onUserLoaded = loadedUser => {
            setUser(loadedUser);
            setAccessToken(loadedUser?.access_token || null);
        };
        const onUserUnloaded = () => {
            setUser(null);
            setAccessToken(null);
        };

        userManager.events.addUserLoaded(onUserLoaded);
        userManager.events.addUserUnloaded(onUserUnloaded);

        return () => {
            mounted = false;
            userManager.events.removeUserLoaded(onUserLoaded);
            userManager.events.removeUserUnloaded(onUserUnloaded);
        };
    }, []);

    const login = () => {
        if (userManager) {
            return userManager.signinRedirect();
        }
        return null;
    };
    const logout = () => {
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

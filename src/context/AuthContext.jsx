import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { userManager } from '../auth/oidc';
import { setAccessToken } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
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

    const login = () => userManager.signinRedirect();
    const logout = () => userManager.signoutRedirect();

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

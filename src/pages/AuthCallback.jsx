import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManager, oidcConfigValid } from '../auth/oidc';
import { completeOidcLogin, setAccessToken, useBackendOidcExchange } from '../services/auth';

export default function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (useBackendOidcExchange()) {
            if (!code || !state) {
                setError('Missing code or state in callback');
                return;
            }
            completeOidcLogin(code, state)
                .then(result => {
                    setAccessToken(result.access_token);
                    window.location.replace('/overview');
                })
                .catch(err => {
                    console.error('OIDC backend exchange failed:', err);
                    setError(err?.message || String(err));
                });
            return;
        }

        if (!oidcConfigValid || !userManager) {
            navigate('/', { replace: true });
            return;
        }
        userManager.signinRedirectCallback()
            .then(async (user) => {
                const currentUser = user || await userManager.getUser();
                setAccessToken(currentUser?.access_token || null);
                window.location.replace('/overview');
            })
            .catch((err) => {
                console.error('OIDC callback failed:', err);
                setError(err?.message || String(err));
            });
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center text-textMuted font-mono">
            {error ? (
                <div className="max-w-lg p-6 bg-surface border border-statusBad/30 text-statusBad rounded">
                    <div className="font-bold mb-2">Sign-in failed</div>
                    <div className="text-xs break-all">{error}</div>
                </div>
            ) : (
                <span>Completing sign-in...</span>
            )}
        </div>
    );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManager, oidcConfigValid } from '../auth/oidc';

export default function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!oidcConfigValid || !userManager) {
            navigate('/', { replace: true });
            return;
        }
        userManager.signinRedirectCallback()
            .then(() => navigate('/overview', { replace: true }))
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

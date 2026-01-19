import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManager } from '../auth/oidc';

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        userManager.signinRedirectCallback()
            .then(() => navigate('/overview', { replace: true }))
            .catch(() => navigate('/', { replace: true }));
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center text-textMuted font-mono">
            Completing sign-in...
        </div>
    );
}

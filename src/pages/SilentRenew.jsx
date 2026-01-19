import { useEffect } from 'react';
import { userManager, oidcConfigValid } from '../auth/oidc';

export default function SilentRenew() {
    useEffect(() => {
        if (!oidcConfigValid || !userManager) {
            return;
        }
        userManager.signinSilentCallback().catch(() => {
            // Silent renew errors are handled by the OIDC client.
        });
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center text-textMuted font-mono">
            Refreshing session...
        </div>
    );
}

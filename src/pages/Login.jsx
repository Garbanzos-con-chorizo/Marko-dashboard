import { useAuth } from '../context/AuthContext';
import { oidcConfigValid } from '../auth/oidc';

export default function Login() {
    const { login } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-text">
            <div className="w-full max-w-md bg-surface border border-border rounded-lg p-8 shadow-xl">
                <h1 className="text-2xl font-bold mb-2">MARKO ACCESS</h1>
                <p className="text-sm text-textSecondary mb-6">
                    Authenticate with your configured identity provider to access the trading console.
                </p>
                {!oidcConfigValid && (
                    <div className="p-3 mb-4 border border-statusBad/30 bg-statusBad/10 text-statusBad text-xs font-mono rounded">
                        Missing OIDC configuration. Set `VITE_OIDC_AUTHORITY` and `VITE_OIDC_CLIENT_ID`.
                    </div>
                )}
                <button
                    onClick={login}
                    className={`w-full py-3 rounded font-bold transition-colors ${oidcConfigValid ? 'bg-primary text-background hover:bg-primary/90' : 'bg-border text-textMuted cursor-not-allowed'}`}
                    disabled={!oidcConfigValid}
                >
                    LOGIN WITH OIDC
                </button>
                <p className="text-xs text-textMuted mt-4 font-mono">
                    Configure your IdP in the Help page before logging in.
                </p>
            </div>
        </div>
    );
}

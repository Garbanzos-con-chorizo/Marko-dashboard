import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-text">
            <div className="w-full max-w-md bg-surface border border-border rounded-lg p-8 shadow-xl">
                <h1 className="text-2xl font-bold mb-2">MARKO ACCESS</h1>
                <p className="text-sm text-textSecondary mb-6">
                    Authenticate with your configured identity provider to access the trading console.
                </p>
                <button
                    onClick={login}
                    className="w-full py-3 bg-primary text-background rounded font-bold hover:bg-primary/90 transition-colors"
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

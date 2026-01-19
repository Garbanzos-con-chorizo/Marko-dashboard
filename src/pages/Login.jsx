import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { oidcConfigValid } from '../auth/oidc';
import { loginLocal, registerLocal, setAccessToken, useBackendOidcExchange } from '../services/auth';

export default function Login() {
    const { login } = useAuth();
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLocal = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            if (mode === 'register') {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                const result = await registerLocal(email, password);
                setAccessToken(result.access_token);
            } else {
                const result = await loginLocal(email, password);
                setAccessToken(result.access_token);
            }
            window.location.reload();
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-text">
            <div className="w-full max-w-md bg-surface border border-border rounded-lg p-8 shadow-xl">
                <h1 className="text-2xl font-bold mb-2">MARKO ACCESS</h1>
                <p className="text-sm text-textSecondary mb-6">
                    Authenticate with your configured identity provider to access the trading console.
                </p>
                <div className="flex items-center gap-2 mb-6">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2 rounded text-xs font-bold ${mode === 'login' ? 'bg-primary text-background' : 'bg-background text-textMuted border border-border'}`}
                    >
                        LOGIN
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        className={`flex-1 py-2 rounded text-xs font-bold ${mode === 'register' ? 'bg-primary text-background' : 'bg-background text-textMuted border border-border'}`}
                    >
                        CREATE ACCOUNT
                    </button>
                </div>
                {!oidcConfigValid && !useBackendOidcExchange() && (
                    <div className="p-3 mb-4 border border-statusBad/30 bg-statusBad/10 text-statusBad text-xs font-mono rounded">
                        Missing OIDC configuration. Set `VITE_OIDC_AUTHORITY` and `VITE_OIDC_CLIENT_ID`.
                    </div>
                )}
                <button
                    onClick={login}
                    className={`w-full py-3 rounded font-bold transition-colors ${(oidcConfigValid || useBackendOidcExchange()) ? 'bg-primary text-background hover:bg-primary/90' : 'bg-border text-textMuted cursor-not-allowed'}`}
                    disabled={!(oidcConfigValid || useBackendOidcExchange())}
                >
                    LOGIN WITH GOOGLE
                </button>
                <div className="my-6 border-t border-border"></div>
                {error && (
                    <div className="p-3 mb-4 border border-statusBad/30 bg-statusBad/10 text-statusBad text-xs font-mono rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={handleLocal} className="space-y-3">
                    <div>
                        <label className="block text-[10px] font-bold text-textSecondary uppercase mb-1.5 ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-background border border-border rounded focus:outline-none focus:border-primary text-sm font-mono"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-textSecondary uppercase mb-1.5 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-background border border-border rounded focus:outline-none focus:border-primary text-sm font-mono"
                            required
                        />
                    </div>
                    {mode === 'register' && (
                        <div>
                            <label className="block text-[10px] font-bold text-textSecondary uppercase mb-1.5 ml-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 bg-background border border-border rounded focus:outline-none focus:border-primary text-sm font-mono"
                                required
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className={`w-full py-3 rounded font-bold transition-colors ${isSubmitting ? 'bg-border text-textMuted cursor-not-allowed' : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-background'}`}
                        disabled={isSubmitting}
                    >
                        {mode === 'register' ? 'CREATE ACCOUNT' : 'LOGIN'}
                    </button>
                </form>
                <p className="text-xs text-textMuted mt-4 font-mono">
                    Configure your IdP in the Help page before logging in.
                </p>
            </div>
        </div>
    );
}

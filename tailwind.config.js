/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--bg-primary)',
                surface: 'var(--bg-secondary)',
                surfaceHighlight: 'var(--bg-tertiary)',
                border: 'var(--border-color)',
                primary: 'var(--accent-primary)',
                text: 'var(--text-primary)',
                textSecondary: 'var(--text-secondary)',
                textMuted: 'var(--text-muted)',
                statusGood: 'var(--status-good)',
                statusWarn: 'var(--status-warn)',
                statusBad: 'var(--status-bad)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}

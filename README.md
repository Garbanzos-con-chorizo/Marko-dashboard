# Marko Dashboard

A high-performance, read-only telemetry dashboard for the **MARKO V4** algorithmic trading engine. Designed for real-time monitoring of strategy performance, portfolio state, and engine health.

## 🚀 Overview

Marko Dashboard provides a centralized interface to monitor the internal state of the MARKO V4 engine without interfering with its execution logic. It consumes a fail-silent API to display engine telemetry, strategy regimes, and interactive price charts with trade overlays.

## 🛠 Architecture

The application is built as a modern React Single Page Application (SPA) with a focus on data integrity and visual excellence.

- **Frontend**: React 19 + Vite 7 for rapid development and optimized builds.
- **State Management**: React Context (`TelemetryContext`) handles global telemetry data and polling synchronization.
- **Styling**: Tailwind CSS v4 using a "Data Terminal" aesthetic (dark mode, high contrast, mono typography).
- **Service Layer**: Decoupled API service (`src/services/api.js`) that manages raw data transformation and mock data fallback.
- **Visualization**: Custom HTML5 Canvas implementation for trade-aware price charts.

## 📦 Dependencies

The core tech stack includes:

### Production
- **React 19**: UI framework.
- **React Router Dom 7**: Client-side routing.
- **Tailwind CSS 4**: Modern CSS-in-JS utility framework.

### Development & Tooling
- **Vite 7**: Build tool and dev server.
- **PostCSS 8**: CSS transformation.
- **Autoprefixer 10**: Browser compatibility.
- **@tailwindcss/postcss**: PostCSS plugin for Tailwind v4 integration.

## ⚙️ Environment Variables

For deployment, the following environment variables should be configured in your CI/CD pipeline or `.env` file:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | The base URL of the MARKO V4 Telemetry API. | `""` (Current Origin) |
| `VITE_USE_MOCK` | Set to `true` to enable mock data for development/UI testing. | `false` |

## 🚀 Deployment

The dashboard is optimized for static hosting (e.g., Azure Static Web Apps, Vercel, Netlify).

1.  **Build the project**:
    ```bash
    npm run build
    ```
2.  **Output**: The production-ready files will be generated in the `dist/` directory.
3.  **Hosting**: Upload the contents of `dist/` to any static web server. Ensure your backend API CORS settings allow requests from the dashboard's domain.

## 🚦 Getting Started

1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Start development server: `npm run dev`.
4.  If no backend is available, set `VITE_USE_MOCK=true` in your `.env`.

---
*Created by the MARKO Systems Team.*

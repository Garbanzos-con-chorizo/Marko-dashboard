# Gemini context (Marko-dashboard)

Repo: Marko-dashboard
Role: React SPA for telemetry, strategies, charts, logs, and catalog.

Key clients:
- src/services/api.js: telemetry, chart, strategies, logs, control.
- src/services/adminService.js: install strategies, create/delete instances.
- src/services/strategyCatalogService.js: catalog list, schema, README.

Runtime notes:
- App wraps StrategyCatalogProvider -> StrategyProvider -> TelemetryProvider.
- StrategyContext polls /api/v2/strategies every 5s and auto-selects the first strategy.
- TelemetryContext polls telemetry + chart every 5s, supports warmup states.
- api.js normalizes V1/V2 responses and supports mock mode via VITE_USE_MOCK.

Integration notes:
- Keep payload and response shapes aligned with backend.
- Prefer non-breaking UI updates and defensive handling.

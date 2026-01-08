# Backend Specification: Dynamic Broker Configuration

## Overview
To support dynamic selection of brokers and secure credential management via the frontend, the `POST /api/v2/admin/instances` endpoint must be enhanced.

## Required API Changes

### 1. Enhanced Payload
The `POST` request body should now accept an optional `broker_config` object.

```json
POST /api/v2/admin/instances
Content-Type: application/json

{
  "strategy_id": "MarkoV4Pure",
  "instance_id": "Trend_BTC_1h",
  "symbol": "BTC/USD",
  "timeframe": "1h",
  // NEW: Configuration Object
  "broker_config": {
    "broker": "ALPACA",  // Enum: "ALPACA", "BINANCE", "COINBASE", "PAPER"
    "mode": "PAPER",     // Enum: "PAPER", "LIVE"
    "api_key": "PK...",  // Optional: If provided, overrides env vars
    "api_secret": "..."  // Optional
  }
}
```

### 2. Credential Handling (Security Requirement)
- **Environment Fallback**: If `api_key` and `api_secret` are NOT provided in the payload, the backend MUST fall back to existing environment variables (e.g., `ALPACA_API_KEY`).
- **Secure Storage**: If credentials ARE provided:
    - They should **NOT** be stored in plain text in `strategies.json` or config logs.
    - Ideally, write them to a secure credentials store or a dedicated `.env.local` file that the engine reloads.
    - If storing in a database, ensure fields are encrypted.

### 3. Validation Logic
The backend should validate the following before accepting the request:
- **Broker Validity**: Ensure the selected broker is supported by the installed engine plugins.
- **Connection Check**: (Optional but Recommended) Attempt a lightweight "ping" or `get_clock` call to the broker using the provided credentials to verify they work before finalizing the instance creation.

## Response Updates
The response should confirm which mode the instance was configured in.

```json
// 200 OK
{
  "success": true,
  "message": "Instance created successfully",
  "instance": {
    "id": "Trend_BTC_1h",
    "broker_type": "ALPACA",
    "execution_mode": "PAPER"
  }
}
```

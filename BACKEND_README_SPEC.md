# Backend Specification: Strategy Documentation (README) Endpoint

## Objective
To enable the frontend to display detailed, formatted documentation (Markdown) for each strategy in the Marketplace "Details" view.

## 1. New Endpoint Required

**GET** `/api/v2/catalog/strategies/{strategy_id}/readme`

### Request
*   **Path Parameter**: `strategy_id` (string) - The unique identifier of the strategy definition (e.g., `TrendFollow_v1`).
*   **Headers**: `Accept: text/markdown`, `text/plain`, `application/json`

### Response

#### Option A: Raw Text/Markdown (Preferred for simplicity)
*   **Status**: `200 OK`
*   **Content-Type**: `text/markdown` or `text/plain`
*   **Body**: The raw content of the `README.md` file.

```markdown
# Trend Following Strategy v1
## Overview
This strategy uses a dual moving average crossover...
(raw markdown content)
```

#### Option B: JSON Wrapper (Alternative)
*   **Status**: `200 OK`
*   **Content-Type**: `application/json`
*   **Body**:
```json
{
  "strategy_id": "TrendFollow_v1",
  "content": "# Trend Following Strategy v1\n..."
}
```

### Error Handling
*   **404 Not Found**: If the strategy exists but has no `README.md` file, or if the strategy ID is invalid.

## 2. Implementation Logic (Python/FastAPI Example)

The backend should look for a `README.md` file in the specific strategy's directory alongside its code (`main.py`, `manifest.json`).

```python
from fastapi.responses import FileResponse, PlainTextResponse
import os

@router.get("/catalog/strategies/{strategy_id}/readme")
async def get_strategy_readme(strategy_id: str):
    # 1. Locate the strategy directory
    strategy_path = locate_strategy_path(strategy_id) # e.g., "./strategies/TrendFollow_v1"
    
    # 2. Check for README.md
    readme_path = os.path.join(strategy_path, "README.md")
    
    if not os.path.exists(readme_path):
        # Gracefully handle missing documentation
        return PlainTextResponse("No documentation available for this strategy.", status_code=404)
        
    # 3. Return the file content directly
    return FileResponse(readme_path, media_type='text/markdown')
```

## 3. Recommended Markdown Features to Support
The frontend is using `react-markdown` with `remark-gfm` (GitHub Flavored Markdown). The backend doesn't need to parse anything, just serve the file. This supports:
*   Headers (`#`, `##`)
*   Lists (ordered & unordered)
*   Code blocks (````python ... ````)
*   Tables (Col 1 | Col 2)
*   Blockquotes

## 4. Why this matters
This allows strategy developers to include:
*   **Logic Explanations**: How the alpha is generated.
*   **Parameter Guides**: What `window_size` or `risk_factor` actually do.
*   **Backtest Reports**: Static tables or links to performance history.

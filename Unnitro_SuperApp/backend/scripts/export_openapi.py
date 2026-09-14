"""OpenAPI JSON export utility for Unnitro SuperApp Pod Beta.

Extracts the comprehensive OpenAPI 3.1.0 schema specification from the
FastAPI application instance and exports a formatted JSON contract
for Pod Alpha (frontend) client SDK generation and API alignment.

Usage:
    python scripts/export_openapi.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.main import app


def export_openapi_schema(output_path: Path | None = None) -> Path:
    """Generate and write the OpenAPI schema JSON to disk."""
    if output_path is None:
        output_path = backend_root / "docs" / "openapi_v1.json"

    output_path.parent.mkdir(parents=True, exist_ok=True)

    openapi_data = app.openapi()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_data, f, indent=2, ensure_ascii=False)

    print(f"[OK] Successfully exported OpenAPI contract to: {output_path}")
    print(f"     Title: {openapi_data.get('info', {}).get('title')}")
    print(f"     Version: {openapi_data.get('info', {}).get('version')}")
    print(f"     Paths: {len(openapi_data.get('paths', {}))} endpoints registered")

    return output_path


if __name__ == "__main__":
    export_openapi_schema()

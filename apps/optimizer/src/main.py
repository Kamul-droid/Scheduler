"""Main entry point for optimization service."""
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "src.api.routes:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


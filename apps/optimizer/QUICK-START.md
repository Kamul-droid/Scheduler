# Optimizer Service - Quick Start

## Overview

Python-based optimization service using Google OR-Tools for schedule generation.

## Local Development

### Prerequisites

- Python 3.11+
- pip

### Setup

```bash
cd apps/optimizer
pip install -r requirements.txt
```

### Run

```bash
# Option 1: Using main.py
python src/main.py

# Option 2: Using uvicorn directly
uvicorn src.api.routes:app --host 0.0.0.0 --port 8000 --reload
```

Service will be available at: `http://localhost:8000`

### Test

```bash
# Health check
curl http://localhost:8000/health

# Test optimization
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d @test_request.json
```

## Docker

### Build and Run

```bash
cd infrastructure
docker-compose up optimizer
```

### View Logs

```bash
docker-compose logs -f optimizer
```

## API Endpoints

- `GET /health` - Health check
- `POST /optimize` - Optimize schedule assignments
- `GET /` - Service information

## Integration

The backend calls this service via REST API:

```typescript
// Backend automatically calls optimizer
const result = await optimizationService.optimizeSchedule({
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-01-31T23:59:59Z",
  options: {
    objective: "balance",
    solutionCount: 3
  }
});
```

## Troubleshooting

**Import errors:**
- Ensure PYTHONPATH includes the project root
- Check that all dependencies are installed

**Service not starting:**
- Check port 8000 is available
- Review logs for errors

**Optimization fails:**
- Check input data format
- Verify constraints are valid
- Review solver logs


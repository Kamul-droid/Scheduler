# Optimization Service

Python-based optimization service using Google OR-Tools for schedule generation and constraint satisfaction.

## Overview

This service provides REST API endpoints for solving complex scheduling optimization problems. It uses OR-Tools' Constraint Programming (CP-SAT) solver to generate optimal schedule assignments while respecting various constraints.

## Technology Stack

- **Python 3.11**: Runtime environment
- **FastAPI**: Modern REST API framework
- **OR-Tools**: Google's optimization library (CP-SAT solver)
- **Pydantic**: Data validation and serialization
- **Uvicorn**: ASGI server

## Service Structure

```
apps/optimizer/
├── src/
│   ├── api/
│   │   └── routes.py          # FastAPI routes and endpoints
│   ├── models/
│   │   ├── employee_model.py  # Employee data models
│   │   ├── schedule_model.py  # Shift and schedule models
│   │   ├── constraint_model.py # Constraint models
│   │   └── optimization_request.py # Request models
│   └── solvers/
│       ├── optimization_engine.py # OR-Tools CP-SAT engine
│       └── schedule_solver.py     # Main scheduling solver
├── requirements.txt
├── main.py
└── README.md
```

## API Endpoints

### Health Check
```
GET /health
```

Returns service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "optimization-service",
  "version": "1.0.0"
}
```

### Optimize
```
POST /optimize
```

Optimizes schedule assignments based on employees, shifts, and constraints.

**Request Body:**
```json
{
  "employees": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "skills": [{"name": "nursing", "level": "certified"}],
      "availability_pattern": {...}
    }
  ],
  "shifts": [
    {
      "id": "uuid",
      "department_id": "uuid",
      "required_skills": ["nursing"],
      "min_staffing": 2,
      "max_staffing": 4,
      "start_time": "2024-01-01T09:00:00Z",
      "end_time": "2024-01-01T17:00:00Z"
    }
  ],
  "constraints": [
    {
      "id": "uuid",
      "type": "max_hours",
      "rules": {"maxHours": 40, "periodInDays": 7},
      "priority": 1,
      "active": true
    }
  ],
  "currentSchedules": [],
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "options": {
    "objective": "balance",
    "allowOvertime": false,
    "maxOptimizationTime": 30,
    "solutionCount": 3
  }
}
```

**Response:**
```json
{
  "optimizationId": "opt_abc123",
  "status": "completed",
  "solutions": [
    {
      "id": "solution_1",
      "score": 1250.5,
      "assignments": [
        {
          "employeeId": "uuid",
          "shiftId": "uuid",
          "startTime": "2024-01-01T09:00:00Z",
          "endTime": "2024-01-01T17:00:00Z"
        }
      ],
      "metrics": {
        "totalCost": 1250.5,
        "fairnessScore": 0.85,
        "constraintViolations": 0,
        "coverage": 1.0
      },
      "solveTime": 1250.5
    }
  ],
  "totalSolveTime": 1250.5,
  "message": "Generated 3 solution(s)"
}
```

## Optimization Algorithms

### Constraint Programming (CP-SAT)

The service uses OR-Tools' CP-SAT solver, which is ideal for:
- **Hard constraints**: Legal requirements, union rules, skill matching
- **Discrete decisions**: Employee-shift assignments (binary variables)
- **Complex constraints**: Multi-variable relationships

### Supported Constraints

1. **Max Hours**: Maximum working hours per period
2. **Min Rest**: Minimum rest period between shifts
3. **Skill Matching**: Employees must have required skills for shifts
4. **Staffing Levels**: Min/max staffing per shift
5. **Fair Distribution**: Distribute shifts fairly among employees

### Optimization Objectives

- **minimize_cost**: Minimize total cost (overtime, penalties)
- **maximize_fairness**: Maximize fairness (minimize variance in hours)
- **balance**: Balance cost and fairness (default)

## How It Works

### 1. Problem Modeling

The solver creates binary decision variables:
- `employee_shift[employee_idx][shift_idx] = 1` if employee is assigned to shift

### 2. Constraint Addition

Constraints are added to the CP-SAT model:
- Staffing constraints (min/max per shift)
- Skill matching constraints
- Max hours constraints
- Min rest constraints
- Fair distribution constraints

### 3. Objective Setting

Based on the objective:
- **minimize_cost**: Minimize total hours/cost
- **maximize_fairness**: Minimize variance in employee hours
- **balance**: Combined objective

### 4. Solution Generation

The solver finds multiple solutions:
- Collects up to `solutionCount` solutions
- Each solution includes assignments and metrics
- Solutions are ranked by objective value

## Integration with Backend

The NestJS backend communicates with this service via REST API:

```typescript
// Backend calls optimizer
const response = await optimizationClient.requestOptimization({
  employees: [...],
  shifts: [...],
  constraints: [...],
  startDate: "...",
  endDate: "...",
  options: {...}
});
```

## Running the Service

### Local Development

```bash
cd apps/optimizer
pip install -r requirements.txt
python src/main.py
```

Service will be available at `http://localhost:8000`

### Docker

```bash
cd infrastructure
docker-compose up optimizer
```

### Environment Variables

- `OPTIMIZER_PORT`: Service port (default: 8000)
- `PYTHONUNBUFFERED`: Set to "1" for proper logging in Docker

## Performance Considerations

- **Time Limits**: Set `maxOptimizationTime` to prevent long-running optimizations
- **Solution Count**: Limit `solutionCount` to balance quality vs. time
- **Problem Size**: For large problems (>100 employees, >500 shifts), consider:
  - Breaking into smaller time windows
  - Using heuristics for initial solution
  - Increasing time limits

## Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Error Handling

The service handles:
- Invalid input data (Pydantic validation)
- Infeasible problems (returns empty solutions)
- Timeout scenarios (returns partial solutions)
- Constraint violations (reports in metrics)

## Future Enhancements

- [ ] Support for more constraint types
- [ ] Heuristic pre-processing for large problems
- [ ] Solution quality metrics
- [ ] Caching of constraint evaluations
- [ ] Parallel solution generation
- [ ] Integration with machine learning for better initial solutions


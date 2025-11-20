# Testing Guide - Resource Scheduler

This document provides a comprehensive guide for testing both the backend and optimizer services.

## Overview

The project uses a pragmatic testing approach focusing on:
- **Integration tests** for critical workflows
- **Unit tests** for business logic
- **E2E tests** for complete user flows
- **API tests** for service contracts

## Backend Testing (NestJS)

### Test Structure

```
apps/backend/
├── src/
│   └── **/
│       └── *.service.spec.ts    # Unit tests
└── test/
    ├── *.e2e-spec.ts            # E2E tests
    └── integration/
        └── *.integration.spec.ts # Integration tests
```

### Running Tests

```bash
cd apps/backend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration
```

### Test Configuration

- **Unit Tests**: `jest.config.js` - Tests in `src/**/*.spec.ts`
- **E2E Tests**: `test/jest-e2e.json` - Tests in `test/**/*.e2e-spec.ts`

### Writing Backend Tests

#### Service Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let mockDependency: jest.Mocked<DependencyService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: DependencyService,
          useValue: {
            method: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
    mockDependency = module.get(DependencyService);
  });

  it('should do something', async () => {
    mockDependency.method.mockResolvedValue({ data: 'test' });
    const result = await service.doSomething();
    expect(result).toBeDefined();
  });
});
```

### Test Coverage

Current test files:
- ✅ `employees.service.spec.ts` - Employee service tests
- ✅ `schedules.service.spec.ts` - Schedule service tests
- ✅ `constraints.service.spec.ts` - Constraint service tests
- ✅ `optimization-client.service.spec.ts` - Optimization client tests
- ✅ `optimization-orchestrator.service.spec.ts` - Orchestrator tests
- ✅ `conflict-detection.service.spec.ts` - Conflict detection tests
- ✅ `rule-engine.service.spec.ts` - Rule engine tests
- ✅ `hasura-client.service.spec.ts` - Hasura client tests
- ✅ `health.e2e-spec.ts` - Health check E2E tests
- ✅ `optimization.integration.spec.ts` - Optimization integration tests

## Optimizer Testing (Python)

### Test Structure

```
apps/optimizer/
├── src/
│   └── ...                     # Source code
└── tests/
    ├── test_models.py          # Model tests
    ├── test_solvers.py         # Solver tests
    ├── test_api.py             # API tests
    ├── test_integration.py     # Integration tests
    └── conftest.py             # Fixtures
```

### Running Tests

```bash
cd apps/optimizer

# Install dependencies
pip install -r requirements.txt
pip install pytest pytest-cov pytest-asyncio httpx

# Run all tests
pytest

# Unit tests only
pytest -m "not integration and not slow"

# Integration tests
pytest -m integration

# With coverage
pytest --cov=src --cov-report=html
```

### Writing Optimizer Tests

#### Model Test Example

```python
import pytest
from src.models.employee_model import Employee

class TestEmployee:
    def test_employee_creation(self):
        employee = Employee(
            id="emp-1",
            name="John Doe",
            email="john@example.com"
        )
        assert employee.id == "emp-1"
        assert employee.name == "John Doe"
```

#### API Test Example

```python
from fastapi.testclient import TestClient
from src.api.routes import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

### Test Coverage

Current test files:
- ✅ `test_models.py` - Model unit tests
- ✅ `test_solvers.py` - Solver unit tests
- ✅ `test_api.py` - API endpoint tests
- ✅ `test_integration.py` - Integration tests
- ✅ `test_optimization_engine.py` - Engine tests

## Test Markers (Python)

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.slow` - Slow-running tests

## Continuous Integration

### Running All Tests

```bash
# Backend
cd apps/backend && npm test

# Optimizer
cd apps/optimizer && pytest
```

### Coverage Reports

```bash
# Backend
cd apps/backend && npm run test:cov

# Optimizer
cd apps/optimizer && pytest --cov=src --cov-report=html
```

## Best Practices

### Backend
1. Mock external dependencies (Hasura, HTTP clients)
2. Test error cases and edge conditions
3. Use descriptive test names
4. Keep tests fast and isolated
5. Clean up mocks in `afterEach`

### Optimizer
1. Use fixtures for common test data
2. Mark slow tests with `@pytest.mark.slow`
3. Test edge cases (empty lists, None values)
4. Use type hints for clarity
5. Keep tests independent

## Test Data

### Fixtures (Python)

Common fixtures in `conftest.py`:
- `sample_employee` - Sample employee
- `sample_shift` - Sample shift
- `sample_constraint` - Sample constraint
- `sample_optimization_request` - Complete request

### Mocks (TypeScript)

Mock services for:
- `HasuraClientService` - Database queries
- `OptimizationClient` - Optimizer API calls
- Other service dependencies

## Troubleshooting

### Backend Tests

**Import errors:**
- Check `jest.config.js` moduleNameMapper
- Verify TypeScript paths in `tsconfig.json`

**Mock not working:**
- Ensure mocks are reset in `afterEach`
- Check mock implementation matches interface

### Optimizer Tests

**Import errors:**
- Verify PYTHONPATH includes `src`
- Check `__init__.py` files exist

**Test not found:**
- Check test file naming: `test_*.py`
- Verify test function naming: `test_*`

## Next Steps

1. Add more integration tests for complex workflows
2. Add performance/load tests
3. Set up CI/CD pipeline
4. Add test coverage reporting to CI
5. Add mutation testing (optional)


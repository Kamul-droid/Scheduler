# Backend Testing Guide

## Test Structure

```
test/
├── app.e2e-spec.ts              # Basic E2E tests
├── health.e2e-spec.ts           # Health check E2E tests
├── integration/                 # Integration tests
│   └── optimization.integration.spec.ts
└── jest-e2e.json                # E2E test configuration

src/
└── modules/
    └── **/
        └── *.service.spec.ts    # Unit tests for services
```

## Running Tests

### Unit Tests
```bash
npm run test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:cov
```

### E2E Tests
```bash
npm run test:e2e
```

### Integration Tests
```bash
npm run test:integration
```

## Test Types

### Unit Tests
- Test individual services in isolation
- Mock dependencies (HasuraClient, other services)
- Fast execution
- Located in `src/**/*.spec.ts`

### Integration Tests
- Test service interactions
- May use test database or mocks
- Located in `test/integration/`

### E2E Tests
- Test complete request/response flow
- Use actual HTTP endpoints
- Located in `test/*.e2e-spec.ts`

## Writing Tests

### Service Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let mockDependency: jest.Mocked<DependencyService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
    expect(mockDependency.method).toHaveBeenCalled();
  });
});
```

## Best Practices

1. **Mock External Dependencies**: Always mock Hasura, HTTP clients, etc.
2. **Test Edge Cases**: Empty arrays, null values, errors
3. **Use Descriptive Names**: Test names should describe what they test
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Clean Up**: Use `afterEach` to clear mocks

## Coverage Goals

- Services: >80% coverage
- Critical paths: 100% coverage
- Edge cases: Covered where possible


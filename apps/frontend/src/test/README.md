# Frontend Testing Guide

This directory contains tests for the frontend application, including CORS configuration and CRUD operations.

## Test Structure

```
src/test/
├── setup.ts              # Test setup and global mocks
├── mocks/
│   ├── handlers.ts       # MSW request handlers
│   └── server.ts         # MSW server setup
├── api/
│   ├── cors.test.ts      # CORS configuration tests
│   └── crud.test.ts      # CRUD operation tests
└── hooks/
    ├── useEmployees.test.ts
    └── useConstraints.test.ts
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Categories

### 1. CORS Tests (`api/cors.test.ts`)

Tests the CORS configuration:
- ✅ Allows requests from frontend origin
- ✅ Handles OPTIONS preflight requests
- ✅ Includes proper CORS headers in responses

**Note**: These tests require the backend to be running. If the backend is not available, tests will skip with a warning.

### 2. CRUD Operation Tests (`api/crud.test.ts`)

Tests CRUD operations for all entities:
- **Employees**: Create, Read, Update, Delete
- **Constraints**: Create, Read, Update, Delete, Get Active
- **Schedules**: Create, Read, Update, Delete

### 3. Hook Tests (`hooks/*.test.ts`)

Tests React Query hooks:
- Data fetching
- Mutations (create, update, delete)
- Error handling
- Loading states

### 4. Component Tests (`components/*.test.tsx`)

Tests React components:
- Rendering
- User interactions
- Form submissions
- Modal operations

## Mocking

Tests use [MSW (Mock Service Worker)](https://mswjs.io/) to mock API requests:
- All API calls are intercepted
- Responses are controlled for predictable testing
- No actual backend required for most tests

## Writing New Tests

### Example: Testing a new API endpoint

```typescript
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { myApi } from '../../lib/api';

describe('My API', () => {
  it('should fetch data', async () => {
    const data = await myApi.getAll();
    expect(data).toBeDefined();
  });

  it('should handle errors', async () => {
    server.use(
      http.get('http://localhost:3000/my-endpoint', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      })
    );

    await expect(myApi.getAll()).rejects.toThrow();
  });
});
```

### Example: Testing a component

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from '../../app/components/MyComponent';

const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('MyComponent', () => {
  it('should render', async () => {
    render(
      <TestWrapper>
        <MyComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

## Test Coverage

Run coverage reports to see which parts of the codebase are tested:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Use MSW for API mocking
3. **Cleanup**: Tests automatically clean up after themselves
4. **Async**: Always use `waitFor` for async operations
5. **User Events**: Use `@testing-library/user-event` for user interactions

## Troubleshooting

### Tests fail with "Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Check that test files are in the correct location

### CORS tests fail
- Ensure backend is running on `http://localhost:3000`
- Check backend CORS configuration
- Tests will skip if backend is not available

### MSW warnings
- Ensure MSW handlers match your API endpoints
- Check that handlers are properly exported


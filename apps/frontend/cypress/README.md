# Cypress E2E Testing

End-to-end tests for the Resource Scheduler frontend application.

## Test Structure

```
cypress/
├── e2e/
│   ├── scheduler-workflows.spec.ts    # Schedule management workflows
│   ├── optimization-flow.spec.ts      # Optimization process tests
│   ├── constraint-validation.spec.ts  # Constraint management tests
│   ├── employee-management.spec.ts    # Employee CRUD operations
│   └── navigation.spec.ts             # Navigation and routing
├── fixtures/
│   └── test-data.json                 # Test data fixtures
└── support/
    ├── commands.ts                    # Custom Cypress commands
    └── e2e.ts                         # Support file configuration
```

## Running Tests

```bash
# Open Cypress Test Runner (interactive)
npm run test:e2e:open

# Run tests in headless mode
npm run test:e2e:headless

# Run specific test file
npx cypress run --spec "cypress/e2e/scheduler-workflows.spec.ts"
```

## Test Coverage

### Scheduler Workflows (`scheduler-workflows.spec.ts`)
- ✅ Week navigation
- ✅ Schedule creation
- ✅ Schedule editing
- ✅ Schedule deletion
- ✅ Employee filtering
- ✅ Conflict detection
- ✅ Responsive design

### Optimization Flow (`optimization-flow.spec.ts`)
- ✅ Optimization panel display
- ✅ Starting optimization
- ✅ Status polling
- ✅ Solution display
- ✅ Applying solutions
- ✅ Error handling

### Constraint Validation (`constraint-validation.spec.ts`)
- ✅ Constraint list display
- ✅ Creating constraints
- ✅ Editing constraints
- ✅ Deleting constraints
- ✅ Active/inactive toggle
- ✅ JSON validation
- ✅ Priority validation

### Employee Management (`employee-management.spec.ts`)
- ✅ Employee list display
- ✅ Creating employees
- ✅ Editing employees
- ✅ Deleting employees
- ✅ Skills management
- ✅ Form validation

### Navigation (`navigation.spec.ts`)
- ✅ Route navigation
- ✅ Active state highlighting
- ✅ Mobile responsiveness

## Custom Commands

### `cy.createEmployee(employee)`
Creates an employee via API
```typescript
cy.createEmployee({
  name: 'John Doe',
  email: 'john@example.com',
  skills: ['JavaScript']
});
```

### `cy.createConstraint(constraint)`
Creates a constraint via API
```typescript
cy.createConstraint({
  type: 'max_hours',
  rules: { maxHoursPerWeek: 40 },
  priority: 50
});
```

### `cy.createSchedule(schedule)`
Creates a schedule via API
```typescript
cy.createSchedule({
  employeeId: '123',
  startTime: '2024-01-01T09:00:00Z',
  endTime: '2024-01-01T17:00:00Z'
});
```

### `cy.clearTestData()`
Clears all test data (employees, constraints, schedules)

### `cy.seedTestData()`
Seeds the database with test data

## Test Environment Setup

### Prerequisites
1. Backend server running on `http://localhost:3000`
2. Frontend dev server running on `http://localhost:3001`
3. Database with test schema

### Environment Variables
Set in `cypress.config.ts`:
- `apiUrl`: Backend API URL (default: `http://localhost:3000`)
- `hasuraUrl`: Hasura GraphQL URL (default: `http://localhost:8080`)

## Best Practices

1. **Test Isolation**: Each test clears and seeds its own data
2. **Wait Strategies**: Use `cy.wait()` for API calls, `cy.contains()` for UI updates
3. **Data Management**: Use custom commands for consistent data setup
4. **Error Handling**: Tests handle both success and error scenarios
5. **Responsive Testing**: Include mobile viewport tests

## Debugging

### View Test Execution
```bash
npm run test:e2e:open
```

### Debug Failed Tests
1. Check Cypress screenshots in `cypress/screenshots/`
2. Review videos in `cypress/videos/`
3. Use `cy.pause()` in tests to debug interactively

### Common Issues

**Tests fail with "element not found"**
- Increase wait times
- Check if element is conditionally rendered
- Verify test data is seeded correctly

**CORS errors**
- Ensure backend CORS is configured correctly
- Check backend is running

**API timeouts**
- Increase `requestTimeout` in `cypress.config.ts`
- Check backend is responsive

## Continuous Integration

Cypress tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Cypress tests
  run: npm run test:e2e:headless
```

## Test Data Management

Tests use a combination of:
- **API calls** for data setup (via custom commands)
- **Fixtures** for static test data
- **Database seeding** for consistent test environment

Each test suite:
1. Clears existing test data
2. Seeds fresh test data
3. Runs tests
4. Cleans up (optional, handled by next test)

## Coverage Goals

- ✅ All critical user workflows
- ✅ All CRUD operations
- ✅ Error handling scenarios
- ✅ Responsive design validation
- ✅ Cross-browser compatibility (via Cypress)


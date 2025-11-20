# Integration Tests

Integration tests verify that multiple components work together correctly.

## Test Files

- `optimization.integration.spec.ts` - Tests optimization flow end-to-end

## Running Integration Tests

```bash
npm run test:integration
```

## Test Requirements

Integration tests may require:
- Running services (Hasura, Optimizer)
- Test database
- Mock services for external dependencies

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Up**: Reset state between tests
3. **Use Test Containers**: For database tests (optional)
4. **Mock External Services**: When possible, mock external APIs


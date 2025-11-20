# Optimizer Testing Guide

## Test Structure

```
tests/
├── __init__.py
├── conftest.py                  # Pytest fixtures
├── test_models.py               # Model unit tests
├── test_solvers.py              # Solver unit tests
├── test_api.py                  # API endpoint tests
└── test_integration.py          # Integration tests
```

## Running Tests

### All Tests
```bash
pytest
```

### Unit Tests Only
```bash
pytest -m "not integration and not slow"
```

### Integration Tests
```bash
pytest -m integration
```

### With Coverage
```bash
pytest --cov=src --cov-report=html
```

### Specific Test File
```bash
pytest tests/test_models.py
```

### Verbose Output
```bash
pytest -v
```

## Test Types

### Unit Tests
- Test individual functions and classes
- Fast execution
- No external dependencies
- Located in `test_*.py` files

### Integration Tests
- Test complete optimization flow
- May take longer
- Marked with `@pytest.mark.integration`
- Located in `test_integration.py`

## Writing Tests

### Test Example

```python
import pytest
from src.models.employee_model import Employee

class TestEmployee:
    def test_employee_creation(self):
        """Test creating an employee."""
        employee = Employee(
            id="emp-1",
            name="John Doe",
            email="john@example.com"
        )
        
        assert employee.id == "emp-1"
        assert employee.name == "John Doe"
```

### Using Fixtures

```python
def test_with_fixture(sample_employee):
    """Test using a fixture."""
    assert sample_employee.name == "John Doe"
```

## Fixtures

Common fixtures available in `conftest.py`:
- `sample_employee` - Sample employee for testing
- `sample_shift` - Sample shift for testing
- `sample_constraint` - Sample constraint for testing
- `sample_optimization_request` - Complete optimization request

## Best Practices

1. **Use Descriptive Names**: Test functions should describe what they test
2. **One Assertion Per Concept**: Test one thing at a time
3. **Use Fixtures**: Reuse test data with fixtures
4. **Mark Slow Tests**: Use `@pytest.mark.slow` for long-running tests
5. **Test Edge Cases**: Empty lists, None values, boundary conditions

## Coverage Goals

- Models: >90% coverage
- Solvers: >80% coverage
- API: >70% coverage
- Critical paths: 100% coverage

## Continuous Integration

Tests should run automatically on:
- Pull requests
- Commits to main branch
- Before deployment


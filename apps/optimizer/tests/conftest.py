"""Pytest configuration and fixtures."""
import pytest
from src.models.employee_model import Employee
from src.models.schedule_model import Shift
from src.models.constraint_model import Constraint


@pytest.fixture
def sample_employee():
    """Sample employee for testing."""
    return Employee(
        id="emp-1",
        name="John Doe",
        email="john@example.com",
        skills=[{"name": "nursing", "level": "certified"}]
    )


@pytest.fixture
def sample_shift():
    """Sample shift for testing."""
    return Shift(
        id="shift-1",
        department_id="dept-1",
        required_skills=["nursing"],
        min_staffing=2,
        max_staffing=4,
        start_time="2024-01-01T09:00:00Z",
        end_time="2024-01-01T17:00:00Z"
    )


@pytest.fixture
def sample_constraint():
    """Sample constraint for testing."""
    return Constraint(
        id="constraint-1",
        type="max_hours",
        rules={"maxHours": 40, "periodInDays": 7},
        priority=1,
        active=True
    )


@pytest.fixture
def sample_optimization_request(sample_employee, sample_shift, sample_constraint):
    """Sample optimization request for testing."""
    from src.models.optimization_request import OptimizationRequest
    
    return OptimizationRequest(
        employees=[sample_employee.dict()],
        shifts=[sample_shift.dict()],
        constraints=[sample_constraint.dict()],
        startDate="2024-01-01T00:00:00Z",
        endDate="2024-01-31T23:59:59Z"
    )


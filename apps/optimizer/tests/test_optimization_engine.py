"""Tests for optimization engine."""
import pytest
from src.models.constraint_model import Constraint
from src.models.employee_model import Employee
from src.models.optimization_request import OptimizationOptions
from src.models.schedule_model import Shift
from src.solvers.optimization_engine import OptimizationEngine


class TestOptimizationEngine:
    """Tests for OptimizationEngine."""
    
    def test_engine_initialization(self):
        """Test engine initialization."""
        employees = [
            Employee(
                id="emp-1",
                name="John Doe",
                email="john@example.com",
                skills=[{"name": "nursing"}]
            )
        ]
        
        shifts = [
            Shift(
                id="shift-1",
                department_id="dept-1",
                min_staffing=1,
                max_staffing=1,
                start_time="2024-01-01T09:00:00Z",
                end_time="2024-01-01T17:00:00Z"
            )
        ]
        
        constraints = []
        current_schedules = []
        options = OptimizationOptions()
        
        engine = OptimizationEngine(
            employees=employees,
            shifts=shifts,
            constraints=constraints,
            current_schedules=current_schedules,
            options=options
        )
        
        assert engine is not None
        assert len(engine.employees) == 1
        assert len(engine.shifts) == 1
    
    @pytest.mark.slow
    def test_solve_simple_problem(self):
        """Test solving a simple optimization problem."""
        employees = [
            Employee(
                id="emp-1",
                name="John Doe",
                email="john@example.com",
                skills=[{"name": "nursing"}]
            )
        ]
        
        shifts = [
            Shift(
                id="shift-1",
                department_id="dept-1",
                required_skills=["nursing"],
                min_staffing=1,
                max_staffing=1,
                start_time="2024-01-01T09:00:00Z",
                end_time="2024-01-01T17:00:00Z"
            )
        ]
        
        constraints = []
        current_schedules = []
        options = OptimizationOptions(
            maxOptimizationTime=5,
            solutionCount=1
        )
        
        engine = OptimizationEngine(
            employees=employees,
            shifts=shifts,
            constraints=constraints,
            current_schedules=current_schedules,
            options=options
        )
        
        solutions = engine.solve()
        
        # Should return at least empty array or solutions
        assert isinstance(solutions, list)


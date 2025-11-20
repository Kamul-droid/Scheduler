"""Tests for optimization solvers."""
import pytest
from src.models.employee_model import Employee
from src.models.schedule_model import Shift
from src.models.constraint_model import Constraint
from src.models.optimization_request import OptimizationRequest, OptimizationOptions
from src.solvers.schedule_solver import ScheduleSolver


class TestScheduleSolver:
    """Tests for ScheduleSolver."""
    
    def test_solve_with_valid_data(self):
        """Test solving with valid employee and shift data."""
        solver = ScheduleSolver()
        
        request = OptimizationRequest(
            employees=[
                {
                    "id": "emp-1",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "skills": [{"name": "nursing"}]
                }
            ],
            shifts=[
                {
                    "id": "shift-1",
                    "department_id": "dept-1",
                    "min_staffing": 1,
                    "max_staffing": 1,
                    "start_time": "2024-01-01T09:00:00Z",
                    "end_time": "2024-01-01T17:00:00Z"
                }
            ],
            constraints=[],
            startDate="2024-01-01T00:00:00Z",
            endDate="2024-01-31T23:59:59Z"
        )
        
        result = solver.solve(request)
        
        assert "status" in result
        assert "solutions" in result
        assert "message" in result
    
    def test_solve_with_no_shifts(self):
        """Test solving with no shifts in date range."""
        solver = ScheduleSolver()
        
        request = OptimizationRequest(
            employees=[],
            shifts=[],
            constraints=[],
            startDate="2024-01-01T00:00:00Z",
            endDate="2024-01-31T23:59:59Z"
        )
        
        result = solver.solve(request)
        
        assert result["status"] == "failed"
        assert "No shifts found" in result["message"]
    
    def test_filter_shifts_by_date_range(self):
        """Test filtering shifts by date range."""
        solver = ScheduleSolver()
        
        shifts = [
            Shift(
                id="shift-1",
                department_id="dept-1",
                min_staffing=1,
                max_staffing=1,
                start_time="2024-01-15T09:00:00Z",
                end_time="2024-01-15T17:00:00Z"
            ),
            Shift(
                id="shift-2",
                department_id="dept-1",
                min_staffing=1,
                max_staffing=1,
                start_time="2024-02-15T09:00:00Z",
                end_time="2024-02-15T17:00:00Z"
            ),
        ]
        
        filtered = solver._filter_shifts_by_date_range(
            shifts,
            "2024-01-01T00:00:00Z",
            "2024-01-31T23:59:59Z"
        )
        
        assert len(filtered) == 1
        assert filtered[0].id == "shift-1"


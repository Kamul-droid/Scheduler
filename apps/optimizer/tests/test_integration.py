"""Integration tests for optimizer service."""
import pytest
from fastapi.testclient import TestClient
from src.api.routes import app

client = TestClient(app)


@pytest.mark.integration
class TestOptimizationIntegration:
    """Integration tests for optimization flow."""
    
    def test_complete_optimization_flow(self):
        """Test complete optimization flow with realistic data."""
        request_data = {
            "employees": [
                {
                    "id": "emp-1",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "skills": [{"name": "nursing"}]
                },
                {
                    "id": "emp-2",
                    "name": "Jane Smith",
                    "email": "jane@example.com",
                    "skills": [{"name": "nursing"}, {"name": "cpr"}]
                }
            ],
            "shifts": [
                {
                    "id": "shift-1",
                    "department_id": "dept-1",
                    "required_skills": ["nursing"],
                    "min_staffing": 1,
                    "max_staffing": 2,
                    "start_time": "2024-01-01T09:00:00Z",
                    "end_time": "2024-01-01T17:00:00Z"
                },
                {
                    "id": "shift-2",
                    "department_id": "dept-1",
                    "required_skills": ["nursing"],
                    "min_staffing": 1,
                    "max_staffing": 2,
                    "start_time": "2024-01-02T09:00:00Z",
                    "end_time": "2024-01-02T17:00:00Z"
                }
            ],
            "constraints": [
                {
                    "id": "constraint-1",
                    "type": "max_hours",
                    "rules": {"maxHours": 40, "periodInDays": 7},
                    "priority": 1,
                    "active": True
                }
            ],
            "startDate": "2024-01-01T00:00:00Z",
            "endDate": "2024-01-31T23:59:59Z",
            "options": {
                "objective": "balance",
                "maxOptimizationTime": 10,
                "solutionCount": 2
            }
        }
        
        response = client.post("/optimize", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "optimizationId" in data
        assert "status" in data
        assert "solutions" in data
        assert isinstance(data["solutions"], list)
        
        # If solutions found, verify structure
        if data["status"] == "completed" and len(data["solutions"]) > 0:
            solution = data["solutions"][0]
            assert "id" in solution
            assert "score" in solution
            assert "assignments" in solution
            assert "metrics" in solution


"""Tests for API endpoints."""
import pytest
from fastapi.testclient import TestClient
from src.api.routes import app

client = TestClient(app)


class TestHealthEndpoint:
    """Tests for health check endpoint."""
    
    def test_health_check(self):
        """Test health check endpoint."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "optimization-service"
        assert data["version"] == "1.0.0"


class TestOptimizeEndpoint:
    """Tests for optimization endpoint."""
    
    def test_optimize_with_valid_request(self):
        """Test optimization with valid request."""
        request_data = {
            "employees": [
                {
                    "id": "emp-1",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "skills": [{"name": "nursing"}]
                }
            ],
            "shifts": [
                {
                    "id": "shift-1",
                    "department_id": "dept-1",
                    "min_staffing": 1,
                    "max_staffing": 1,
                    "start_time": "2024-01-01T09:00:00Z",
                    "end_time": "2024-01-01T17:00:00Z"
                }
            ],
            "constraints": [],
            "startDate": "2024-01-01T00:00:00Z",
            "endDate": "2024-01-31T23:59:59Z",
            "options": {
                "objective": "balance",
                "maxOptimizationTime": 5,
                "solutionCount": 1
            }
        }
        
        response = client.post("/optimize", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "optimizationId" in data
        assert "status" in data
        assert "solutions" in data
    
    def test_optimize_with_invalid_request(self):
        """Test optimization with invalid request."""
        request_data = {
            "employees": [],
            "shifts": [],
            "constraints": [],
            # Missing required fields
        }
        
        response = client.post("/optimize", json=request_data)
        
        # Should return validation error
        assert response.status_code == 422
    
    def test_optimize_with_no_shifts(self):
        """Test optimization with no shifts."""
        request_data = {
            "employees": [
                {
                    "id": "emp-1",
                    "name": "John Doe",
                    "email": "john@example.com"
                }
            ],
            "shifts": [],
            "constraints": [],
            "startDate": "2024-01-01T00:00:00Z",
            "endDate": "2024-01-31T23:59:59Z"
        }
        
        response = client.post("/optimize", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "failed"
        assert "No shifts found" in data["message"]


class TestRootEndpoint:
    """Tests for root endpoint."""
    
    def test_root_endpoint(self):
        """Test root endpoint."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Resource Scheduler Optimization Service"
        assert "endpoints" in data


"""Tests for data models."""
from datetime import datetime

import pytest
from src.models.constraint_model import Constraint
from src.models.employee_model import Employee
from src.models.schedule_model import Schedule, Shift


class TestEmployee:
    """Tests for Employee model."""
    
    def test_employee_creation(self):
        """Test creating an employee."""
        employee = Employee(
            id="emp-1",
            name="John Doe",
            email="john@example.com",
            skills=[{"name": "nursing", "level": "certified"}]
        )
        
        assert employee.id == "emp-1"
        assert employee.name == "John Doe"
        assert employee.email == "john@example.com"
    
    def test_get_skill_names(self):
        """Test extracting skill names."""
        employee = Employee(
            id="emp-1",
            name="John Doe",
            email="john@example.com",
            skills=[{"name": "nursing"}, {"name": "cpr"}]
        )
        
        skill_names = employee.get_skill_names()
        assert "nursing" in skill_names
        assert "cpr" in skill_names
    
    def test_has_skill(self):
        """Test skill checking."""
        employee = Employee(
            id="emp-1",
            name="John Doe",
            email="john@example.com",
            skills=[{"name": "nursing"}]
        )
        
        assert employee.has_skill("nursing") is True
        assert employee.has_skill("cpr") is False


class TestShift:
    """Tests for Shift model."""
    
    def test_shift_creation(self):
        """Test creating a shift."""
        shift = Shift(
            id="shift-1",
            department_id="dept-1",
            min_staffing=2,
            max_staffing=4,
            start_time="2024-01-01T09:00:00Z",
            end_time="2024-01-01T17:00:00Z"
        )
        
        assert shift.id == "shift-1"
        assert shift.min_staffing == 2
        assert shift.max_staffing == 4
    
    def test_get_duration_hours(self):
        """Test calculating shift duration."""
        shift = Shift(
            id="shift-1",
            department_id="dept-1",
            min_staffing=1,
            max_staffing=1,
            start_time="2024-01-01T09:00:00Z",
            end_time="2024-01-01T17:00:00Z"
        )
        
        duration = shift.get_duration_hours()
        assert duration == 8.0
    
    def test_get_required_skills(self):
        """Test extracting required skills."""
        shift = Shift(
            id="shift-1",
            department_id="dept-1",
            required_skills=["nursing", "cpr"],
            min_staffing=1,
            max_staffing=1,
            start_time="2024-01-01T09:00:00Z",
            end_time="2024-01-01T17:00:00Z"
        )
        
        skills = shift.get_required_skills()
        assert "nursing" in skills
        assert "cpr" in skills


class TestConstraint:
    """Tests for Constraint model."""
    
    def test_constraint_creation(self):
        """Test creating a constraint."""
        constraint = Constraint(
            id="constraint-1",
            type="max_hours",
            rules={"maxHours": 40, "periodInDays": 7},
            priority=1,
            active=True
        )
        
        assert constraint.type == "max_hours"
        assert constraint.get_max_hours() == 40
        assert constraint.get_period_days() == 7
    
    def test_min_rest_constraint(self):
        """Test min rest constraint."""
        constraint = Constraint(
            id="constraint-2",
            type="min_rest",
            rules={"minRestHours": 8.0},
            priority=1
        )
        
        assert constraint.get_min_rest_hours() == 8.0


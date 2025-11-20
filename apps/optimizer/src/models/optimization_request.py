"""Optimization request models."""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .constraint_model import Constraint
from .employee_model import Employee
from .schedule_model import Schedule, Shift


class OptimizationOptions(BaseModel):
    """Optimization options."""
    objective: str = Field(
        default='balance',
        description="Optimization objective: minimize_cost, maximize_fairness, or balance"
    )
    allowOvertime: bool = False
    maxOptimizationTime: int = Field(default=30, ge=1, le=300, description="Max time in seconds")
    solutionCount: int = Field(default=3, ge=1, le=10, description="Number of solutions to return")


class OptimizationRequest(BaseModel):
    """Complete optimization request."""
    employees: List[Dict[str, Any]]
    shifts: List[Dict[str, Any]]
    constraints: List[Dict[str, Any]]
    currentSchedules: Optional[List[Dict[str, Any]]] = None
    startDate: str
    endDate: str
    options: Optional[Dict[str, Any]] = None

    def get_employees(self) -> List[Employee]:
        """Convert employee dicts to Employee models."""
        return [Employee(**emp) for emp in self.employees]

    def get_shifts(self) -> List[Shift]:
        """Convert shift dicts to Shift models."""
        return [Shift(**shift) for shift in self.shifts]

    def get_constraints(self) -> List[Constraint]:
        """Convert constraint dicts to Constraint models."""
        return [Constraint(**constraint) for constraint in self.constraints 
                if constraint.get('active', True)]

    def get_current_schedules(self) -> List[Schedule]:
        """Convert schedule dicts to Schedule models."""
        if not self.currentSchedules:
            return []
        return [Schedule(**sched) for sched in self.currentSchedules]

    def get_options(self) -> OptimizationOptions:
        """Get optimization options with defaults."""
        if not self.options:
            return OptimizationOptions()
        return OptimizationOptions(**self.options)


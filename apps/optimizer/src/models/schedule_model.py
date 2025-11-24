"""Schedule and shift data models."""
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class Shift(BaseModel):
    """Shift model for optimization."""
    id: str
    department_id: str
    required_skills: Optional[Dict[str, Any]] = None
    min_staffing: int = Field(..., ge=0)
    max_staffing: int = Field(..., ge=1)
    start_time: str  # ISO format datetime string
    end_time: str    # ISO format datetime string
    metadata: Optional[Dict[str, Any]] = None

    def get_required_skills(self) -> list:
        """Extract required skills as a list."""
        if not self.required_skills:
            return []
        if isinstance(self.required_skills, list):
            # Array format: [{ name: 'skill' }] or ['skill']
            return [skill.get('name', skill) if isinstance(skill, dict) else str(skill)
                    for skill in self.required_skills]
        elif isinstance(self.required_skills, dict):
            # Dictionary format: { 'skill': true } (from backend transformation)
            return list(self.required_skills.keys())
        return []

    def get_duration_hours(self) -> float:
        """Calculate shift duration in hours."""
        start = datetime.fromisoformat(self.start_time.replace('Z', '+00:00'))
        end = datetime.fromisoformat(self.end_time.replace('Z', '+00:00'))
        return (end - start).total_seconds() / 3600.0


class Schedule(BaseModel):
    """Existing schedule assignment."""
    id: str
    employee_id: str
    shift_id: str
    start_time: str
    end_time: str
    status: str  # confirmed, tentative, conflict
    metadata: Optional[Dict[str, Any]] = None


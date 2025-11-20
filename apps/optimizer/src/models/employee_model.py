"""Employee data models for optimization."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Skill(BaseModel):
    """Employee skill representation."""
    name: str
    level: Optional[str] = None


class AvailabilityWindow(BaseModel):
    """Availability time window."""
    dayOfWeek: int = Field(..., description="0-6 for Sunday-Saturday")
    startTime: str = Field(..., description="Time in HH:MM format")
    endTime: str = Field(..., description="Time in HH:MM format")


class Employee(BaseModel):
    """Employee model for optimization."""
    id: str
    name: str
    email: str
    skills: Optional[List[Dict[str, Any]]] = None
    availability_pattern: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

    def get_skill_names(self) -> List[str]:
        """Extract skill names from skills array."""
        if not self.skills:
            return []
        return [skill.get('name', skill) if isinstance(skill, dict) else str(skill) 
                for skill in self.skills]

    def has_skill(self, skill_name: str) -> bool:
        """Check if employee has a specific skill."""
        return skill_name in self.get_skill_names()


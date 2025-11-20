"""Constraint models for optimization."""
from typing import Any, Dict
from pydantic import BaseModel, Field


class Constraint(BaseModel):
    """Constraint model for optimization."""
    id: str
    type: str  # max_hours, min_rest, fair_distribution, skill_requirement, etc.
    rules: Dict[str, Any]
    priority: int = Field(default=0, ge=0)
    active: bool = True

    def get_max_hours(self) -> Optional[float]:
        """Get max hours from rules if type is max_hours."""
        if self.type == 'max_hours':
            return self.rules.get('maxHours')
        return None

    def get_period_days(self) -> Optional[int]:
        """Get period in days for max_hours constraint."""
        if self.type == 'max_hours':
            return self.rules.get('periodInDays', 7)
        return None

    def get_min_rest_hours(self) -> Optional[float]:
        """Get minimum rest hours if type is min_rest."""
        if self.type == 'min_rest':
            return self.rules.get('minRestHours', 8.0)
        return None


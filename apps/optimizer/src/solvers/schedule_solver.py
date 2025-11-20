"""Main scheduling solver."""
from typing import Dict, List

from ..models.constraint_model import Constraint
from ..models.employee_model import Employee
from ..models.optimization_request import (OptimizationOptions,
                                           OptimizationRequest)
from ..models.schedule_model import Schedule, Shift
from .optimization_engine import OptimizationEngine


class ScheduleSolver:
    """Main solver for schedule optimization."""
    
    def solve(self, request: OptimizationRequest) -> Dict:
        """Solve the scheduling optimization problem."""
        employees = request.get_employees()
        shifts = request.get_shifts()
        constraints = request.get_constraints()
        current_schedules = request.get_current_schedules()
        options = request.get_options()
        
        # Filter shifts by date range
        filtered_shifts = self._filter_shifts_by_date_range(shifts, request.startDate, request.endDate)
        
        if not filtered_shifts:
            return {
                'status': 'failed',
                'message': 'No shifts found in the specified date range',
                'solutions': [],
                'totalSolveTime': 0,
            }
        
        # Create optimization engine
        engine = OptimizationEngine(
            employees=employees,
            shifts=filtered_shifts,
            constraints=constraints,
            current_schedules=current_schedules,
            options=options
        )
        
        # Solve
        solutions = engine.solve()
        
        if solutions:
            total_solve_time = sum(s.get('solveTime', 0) for s in solutions)
            return {
                'status': 'completed',
                'message': f'Generated {len(solutions)} solution(s)',
                'solutions': solutions,
                'totalSolveTime': total_solve_time,
            }
        else:
            return {
                'status': 'failed',
                'message': 'No feasible solution found',
                'solutions': [],
                'totalSolveTime': 0,
            }
    
    def _filter_shifts_by_date_range(self, shifts: List[Shift], start_date: str, end_date: str) -> List[Shift]:
        """Filter shifts that overlap with the date range."""
        from datetime import datetime
        
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        filtered = []
        for shift in shifts:
            shift_start = datetime.fromisoformat(shift.start_time.replace('Z', '+00:00'))
            shift_end = datetime.fromisoformat(shift.end_time.replace('Z', '+00:00'))
            
            # Include if shift overlaps with date range
            if shift_start < end and shift_end > start:
                filtered.append(shift)
        
        return filtered


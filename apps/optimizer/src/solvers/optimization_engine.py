"""OR-Tools optimization engine for scheduling."""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import time

from ortools.sat.python import cp_model

from ..models.employee_model import Employee
from ..models.schedule_model import Shift, Schedule
from ..models.constraint_model import Constraint
from ..models.optimization_request import OptimizationOptions


class OptimizationEngine:
    """Main optimization engine using OR-Tools CP-SAT solver."""

    def __init__(
        self,
        employees: List[Employee],
        shifts: List[Shift],
        constraints: List[Constraint],
        current_schedules: List[Schedule],
        options: OptimizationOptions
    ):
        self.employees = employees
        self.shifts = shifts
        self.constraints = constraints
        self.current_schedules = current_schedules
        self.options = options
        
        # Create model
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        
        # Set time limit
        self.solver.parameters.max_time_in_seconds = float(options.maxOptimizationTime)
        
        # Decision variables: employee_shift[employee_idx][shift_idx] = 1 if assigned
        self.employee_shift = {}
        self.employee_idx_map = {emp.id: idx for idx, emp in enumerate(employees)}
        self.shift_idx_map = {shift.id: idx for idx, shift in enumerate(shifts)}

    def solve(self) -> List[Dict]:
        """Solve the optimization problem and return solutions."""
        start_time = time.time()
        
        # Create decision variables
        self._create_variables()
        
        # Add constraints
        self._add_constraints()
        
        # Set objective
        self._set_objective()
        
        # Solve
        solution_callback = SolutionCollector(
            self.employee_shift,
            self.employees,
            self.shifts,
            self.options.solutionCount
        )
        
        status = self.solver.Solve(self.model, solution_callback)
        
        solve_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            solutions = solution_callback.get_solutions()
            if not solutions:
                # If no solutions collected, create one from current state
                solutions = [self._create_solution_from_current(solve_time)]
            return solutions
        else:
            # Return partial solution if available
            return solution_callback.get_solutions()

    def _create_variables(self):
        """Create decision variables for employee-shift assignments."""
        num_employees = len(self.employees)
        num_shifts = len(self.shifts)
        
        for emp_idx in range(num_employees):
            self.employee_shift[emp_idx] = {}
            for shift_idx in range(num_shifts):
                var_name = f'emp_{emp_idx}_shift_{shift_idx}'
                self.employee_shift[emp_idx][shift_idx] = self.model.NewBoolVar(var_name)

    def _add_constraints(self):
        """Add all constraints to the model."""
        # Staffing constraints
        self._add_staffing_constraints()
        
        # Skill matching constraints
        self._add_skill_constraints()
        
        # Max hours constraints
        self._add_max_hours_constraints()
        
        # Min rest constraints
        self._add_min_rest_constraints()
        
        # Fair distribution constraints
        self._add_fair_distribution_constraints()

    def _add_staffing_constraints(self):
        """Ensure each shift has required staffing levels."""
        for shift_idx, shift in enumerate(self.shifts):
            assigned = [
                self.employee_shift[emp_idx][shift_idx]
                for emp_idx in range(len(self.employees))
            ]
            total_assigned = sum(assigned)
            self.model.Add(total_assigned >= shift.min_staffing)
            self.model.Add(total_assigned <= shift.max_staffing)

    def _add_skill_constraints(self):
        """Ensure employees assigned to shifts have required skills."""
        for shift_idx, shift in enumerate(self.shifts):
            required_skills = shift.get_required_skills()
            if not required_skills:
                continue
                
            for emp_idx, employee in enumerate(self.employees):
                has_all_skills = all(
                    employee.has_skill(skill) for skill in required_skills
                )
                if not has_all_skills:
                    # Employee cannot be assigned to this shift
                    self.model.Add(self.employee_shift[emp_idx][shift_idx] == 0)

    def _add_max_hours_constraints(self):
        """Add maximum hours per period constraints."""
        max_hours_constraints = [
            c for c in self.constraints if c.type == 'max_hours'
        ]
        
        for constraint in max_hours_constraints:
            max_hours = constraint.get_max_hours()
            period_days = constraint.get_period_days() or 7
            
            if max_hours:
                # Convert hours to minutes (integers) for OR-Tools CP-SAT
                # CP-SAT requires integer coefficients for linear constraints
                max_minutes = int(max_hours * 60)
                
                # Calculate hours per employee for shifts in the period
                for emp_idx, employee in enumerate(self.employees):
                    total_minutes = []
                    for shift_idx, shift in enumerate(self.shifts):
                        hours = shift.get_duration_hours()
                        # Convert hours to minutes (integer)
                        minutes = int(round(hours * 60))
                        total_minutes.append(
                            self.employee_shift[emp_idx][shift_idx] * minutes
                        )
                    if total_minutes:
                        self.model.Add(sum(total_minutes) <= max_minutes)

    def _add_min_rest_constraints(self):
        """Add minimum rest between shifts constraints."""
        min_rest_constraints = [
            c for c in self.constraints if c.type == 'min_rest'
        ]
        
        if not min_rest_constraints:
            return
            
        min_rest_hours = min_rest_constraints[0].get_min_rest_hours() or 8.0
        
        # For each employee, ensure minimum rest between consecutive shifts
        for emp_idx in range(len(self.employees)):
            for shift1_idx, shift1 in enumerate(self.shifts):
                for shift2_idx, shift2 in enumerate(self.shifts):
                    if shift1_idx == shift2_idx:
                        continue
                    
                    # Check if shifts are consecutive
                    shift1_end = datetime.fromisoformat(
                        shift1.end_time.replace('Z', '+00:00')
                    )
                    shift2_start = datetime.fromisoformat(
                        shift2.start_time.replace('Z', '+00:00')
                    )
                    
                    rest_hours = (shift2_start - shift1_end).total_seconds() / 3600.0
                    
                    if 0 < rest_hours < min_rest_hours:
                        # Cannot assign both shifts to same employee
                        self.model.Add(
                            self.employee_shift[emp_idx][shift1_idx] +
                            self.employee_shift[emp_idx][shift2_idx] <= 1
                        )

    def _add_fair_distribution_constraints(self):
        """Add fair distribution constraints."""
        fair_dist_constraints = [
            c for c in self.constraints if c.type == 'fair_distribution'
        ]
        
        if not fair_dist_constraints:
            return
        
        # Ensure shifts are distributed fairly among employees
        num_shifts = len(self.shifts)
        num_employees = len(self.employees)
        
        if num_employees == 0:
            return
        
        # Calculate target shifts per employee
        target_shifts = num_shifts // num_employees
        max_shifts = target_shifts + 1
        
        for emp_idx in range(num_employees):
            employee_shifts = [
                self.employee_shift[emp_idx][shift_idx]
                for shift_idx in range(num_shifts)
            ]
            if employee_shifts:
                self.model.Add(sum(employee_shifts) <= max_shifts)

    def _set_objective(self):
        """Set optimization objective."""
        if self.options.objective == 'minimize_cost':
            self._minimize_cost()
        elif self.options.objective == 'maximize_fairness':
            self._maximize_fairness()
        else:  # balance
            self._balance_objective()

    def _minimize_cost(self):
        """Minimize total cost (e.g., overtime, penalties)."""
        cost = []
        for emp_idx in range(len(self.employees)):
            for shift_idx, shift in enumerate(self.shifts):
                hours = shift.get_duration_hours()
                # Convert hours to minutes (integer) for OR-Tools CP-SAT
                minutes = int(round(hours * 60))
                # Simple cost model: cost increases with hours
                cost.append(self.employee_shift[emp_idx][shift_idx] * minutes)
        self.model.Minimize(sum(cost))

    def _maximize_fairness(self):
        """Maximize fairness (minimize variance in hours)."""
        # Simplified: minimize difference between max and min hours per employee
        # Use integer variables for hours (in minutes)
        employee_hours_vars = []
        for emp_idx in range(len(self.employees)):
            hours_terms = []
            for shift_idx, shift in enumerate(self.shifts):
                hours = shift.get_duration_hours()
                # Convert hours to minutes (integer) for OR-Tools CP-SAT
                minutes = int(round(hours * 60))
                hours_terms.append(
                    self.employee_shift[emp_idx][shift_idx] * minutes
                )
            if hours_terms:
                # Create integer variable for total hours (in minutes)
                total_minutes = self.model.NewIntVar(0, 10000, f'emp_{emp_idx}_total_minutes')
                self.model.Add(total_minutes == sum(hours_terms))
                employee_hours_vars.append(total_minutes)
            else:
                zero_var = self.model.NewIntVar(0, 0, f'emp_{emp_idx}_total_minutes')
                employee_hours_vars.append(zero_var)
        
        # Minimize variance (simplified: minimize max - min)
        if employee_hours_vars:
            max_hours_var = self.model.NewIntVar(0, 10000, 'max_hours')
            min_hours_var = self.model.NewIntVar(0, 10000, 'min_hours')
            
            # max_hours_var >= all employee hours
            for hours_var in employee_hours_vars:
                self.model.Add(max_hours_var >= hours_var)
            
            # min_hours_var <= all employee hours
            for hours_var in employee_hours_vars:
                self.model.Add(min_hours_var <= hours_var)
            
            # Minimize the difference
            self.model.Minimize(max_hours_var - min_hours_var)

    def _balance_objective(self):
        """Balance cost and fairness."""
        # Combined objective: minimize cost with fairness consideration
        cost = []
        for emp_idx in range(len(self.employees)):
            for shift_idx, shift in enumerate(self.shifts):
                hours = shift.get_duration_hours()
                # Convert hours to minutes (integer) for OR-Tools CP-SAT
                minutes = int(round(hours * 60))
                cost.append(self.employee_shift[emp_idx][shift_idx] * minutes)
        
        if cost:
            self.model.Minimize(sum(cost))

    def _create_solution_from_current(self, solve_time: float) -> Dict:
        """Create a solution from current schedules if optimization fails."""
        assignments = []
        for schedule in self.current_schedules:
            if schedule.status == 'confirmed':
                assignments.append({
                    'employeeId': schedule.employee_id,
                    'shiftId': schedule.shift_id,
                    'startTime': schedule.start_time,
                    'endTime': schedule.end_time,
                })
        
        return {
            'id': 'current',
            'score': 0.0,
            'assignments': assignments,
            'metrics': {
                'totalCost': 0,
                'fairnessScore': 0.5,
                'constraintViolations': 0,
                'coverage': len(assignments) / len(self.shifts) if self.shifts else 0,
            },
            'solveTime': solve_time,
        }


class SolutionCollector(cp_model.CpSolverSolutionCallback):
    """Collects multiple solutions during optimization."""
    
    def __init__(self, employee_shift, employees, shifts, max_solutions):
        cp_model.CpSolverSolutionCallback.__init__(self)
        self.employee_shift = employee_shift
        self.employees = employees
        self.shifts = shifts
        self.max_solutions = max_solutions
        self.solutions = []
        self.solution_count = 0
    
    def on_solution_callback(self):
        """Called when a new solution is found."""
        if self.solution_count >= self.max_solutions:
            return
        
        assignments = []
        for emp_idx, employee in enumerate(self.employees):
            for shift_idx, shift in enumerate(self.shifts):
                if self.Value(self.employee_shift[emp_idx][shift_idx]):
                    assignments.append({
                        'employeeId': employee.id,
                        'shiftId': shift.id,
                        'startTime': shift.start_time,
                        'endTime': shift.end_time,
                    })
        
        # Calculate metrics
        metrics = self._calculate_metrics(assignments)
        
        solution = {
            'id': f'solution_{self.solution_count + 1}',
            'score': self.ObjectiveValue() if hasattr(self, 'ObjectiveValue') else 0.0,
            'assignments': assignments,
            'metrics': metrics,
            'solveTime': self.WallTime() * 1000,  # Convert to milliseconds
        }
        
        self.solutions.append(solution)
        self.solution_count += 1
    
    def _calculate_metrics(self, assignments) -> Dict:
        """Calculate solution metrics."""
        total_hours = sum(
            (datetime.fromisoformat(a['endTime'].replace('Z', '+00:00')) -
             datetime.fromisoformat(a['startTime'].replace('Z', '+00:00'))).total_seconds() / 3600
            for a in assignments
        )
        
        employee_hours = {}
        for assignment in assignments:
            emp_id = assignment['employeeId']
            hours = (datetime.fromisoformat(assignment['endTime'].replace('Z', '+00:00')) -
                    datetime.fromisoformat(assignment['startTime'].replace('Z', '+00:00'))).total_seconds() / 3600
            employee_hours[emp_id] = employee_hours.get(emp_id, 0) + hours
        
        fairness_score = 1.0
        if employee_hours:
            hours_list = list(employee_hours.values())
            if len(hours_list) > 1:
                variance = sum((h - sum(hours_list) / len(hours_list))**2 for h in hours_list) / len(hours_list)
                fairness_score = 1.0 / (1.0 + variance)  # Higher is better
        
        return {
            'totalCost': total_hours * 10,  # Simplified cost model
            'fairnessScore': fairness_score,
            'constraintViolations': 0,  # Would need to check constraints
            'coverage': len(set(a['shiftId'] for a in assignments)) / len(self.shifts) if self.shifts else 0,
        }
    
    def get_solutions(self) -> List[Dict]:
        """Get collected solutions."""
        return self.solutions


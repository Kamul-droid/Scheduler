# Optimization Request Validation

This document describes the validation system for optimization requests in the frontend and how the payload flows from frontend → backend → optimizer.

## Frontend Validation

The frontend now includes comprehensive validation before sending optimization requests to the backend.

### Validation Rules

1. **Required Fields:**
   - `startDate`: Must be a valid ISO date string
   - `endDate`: Must be a valid ISO date string

2. **Date Range Validation:**
   - `endDate` must be after `startDate`
   - Warning if date range exceeds 90 days

3. **Options Validation:**
   - `maxOptimizationTime`: Must be between 1 and 300 seconds
   - `solutionCount`: Must be between 1 and 10
   - `objective`: Must be one of: `minimize_cost`, `maximize_fairness`, `balance`

4. **Context-Based Warnings:**
   - Warning if no employees are available
   - Warning if no shifts found in the selected date range
   - Warning if no active constraints are defined

### Validation Implementation

The validation is implemented in `apps/frontend/src/app/features/scheduler/optimization-validation.ts`:

- `validateOptimizationRequest()`: Main validation function
- `formatValidationErrors()`: Formats errors for display
- `formatValidationWarnings()`: Formats warnings for display

### UI Features

The `OptimizationPanel` component now includes:

- **Form Fields:**
  - Start Date (datetime-local input)
  - End Date (datetime-local input)
  - Objective (dropdown: balance, minimize_cost, maximize_fairness)
  - Solution Count (number input, 1-10)
  - Max Optimization Time (number input, 1-300 seconds)
  - Allow Overtime (checkbox)

- **Validation Display:**
  - Red error box for validation errors (blocks submission)
  - Yellow warning box for warnings (allows submission but informs user)

- **Real-time Validation:**
  - Validates on form submission
  - Shows specific error messages for each validation failure
  - Displays warnings for potential issues

## Payload Flow

### Frontend → Backend

The frontend sends an `OptimizationRequestDto` to the backend:

```typescript
{
  startDate: string;        // ISO date string
  endDate: string;          // ISO date string
  employeeIds?: string[];    // Optional: filter specific employees
  departmentIds?: string[];  // Optional: filter specific departments
  options?: {
    objective?: 'minimize_cost' | 'maximize_fairness' | 'balance';
    allowOvertime?: boolean;
    maxOptimizationTime?: number;  // 1-300 seconds
    solutionCount?: number;         // 1-10
  };
}
```

### Backend → Optimizer

The backend's `OptimizationOrchestrator.collectCurrentState()` transforms the request into the optimizer's expected format:

```typescript
{
  employees: Array<{
    id: string;
    name: string;
    email: string;
    skills: any;                    // JSONB from database
    availability_pattern: any;      // JSONB from database
    metadata: any;                 // JSONB from database
  }>;
  shifts: Array<{
    id: string;
    department_id: string;
    required_skills: any;          // JSONB from database
    min_staffing: number;
    max_staffing: number;
    start_time: string;            // ISO timestamp
    end_time: string;              // ISO timestamp
    metadata: any;                 // JSONB from database
  }>;
  constraints: Array<{
    id: string;
    type: string;
    rules: any;                    // JSONB, normalized for optimizer
    priority: number;
  }>;
  currentSchedules?: Array<{
    id: string;
    employee_id: string;
    shift_id: string;
    start_time: string;
    end_time: string;
    status: string;
  }>;
  startDate: string;               // ISO date string
  endDate: string;                 // ISO date string
  options?: {
    objective?: string;
    allowOvertime?: boolean;
    maxOptimizationTime?: number;
    solutionCount?: number;
  };
}
```

### Optimizer Expected Format

The Python optimizer expects a `OptimizationRequest` (Pydantic model):

```python
{
  "employees": List[Dict[str, Any]],      # Required
  "shifts": List[Dict[str, Any]],         # Required
  "constraints": List[Dict[str, Any]],    # Required
  "currentSchedules": Optional[List[Dict[str, Any]]],
  "startDate": str,                       # Required, ISO format
  "endDate": str,                         # Required, ISO format
  "options": Optional[Dict[str, Any]]     # Optional
}
```

The optimizer's `OptimizationOptions` model expects:
- `objective`: str (default: 'balance')
- `allowOvertime`: bool (default: False)
- `maxOptimizationTime`: int (default: 30, range: 1-300)
- `solutionCount`: int (default: 3, range: 1-10)

## Field Name Mapping

| Frontend | Backend DTO | Backend State | Optimizer |
|----------|-------------|---------------|-----------|
| `startDate` | `startDate` | `startDate` | `startDate` |
| `endDate` | `endDate` | `endDate` | `endDate` |
| `options.objective` | `options.objective` | `options.objective` | `options.objective` |
| `options.allowOvertime` | `options.allowOvertime` | `options.allowOvertime` | `options.allowOvertime` |
| `options.maxOptimizationTime` | `options.maxOptimizationTime` | `options.maxOptimizationTime` | `options.maxOptimizationTime` |
| `options.solutionCount` | `options.solutionCount` | `options.solutionCount` | `options.solutionCount` |

## Constraint Rule Normalization

The backend normalizes constraint rules before sending to the optimizer:

- **MAX_HOURS constraint**: If `rules.maxHoursPerWeek` exists, it's converted to `rules.maxHours` with `rules.periodInDays = 7` for optimizer compatibility.

## Error Handling

1. **Frontend Validation Errors:**
   - Displayed in red error box
   - Blocks form submission
   - Lists all missing/invalid fields

2. **Backend Errors:**
   - Caught and returned as error response
   - Displayed in frontend error box

3. **Optimizer Errors:**
   - Caught by backend and returned as failed optimization
   - Error message displayed to user

## Testing

To test the validation:

1. **Missing Required Fields:**
   - Leave start date or end date empty → Should show error

2. **Invalid Date Range:**
   - Set end date before start date → Should show error

3. **Invalid Options:**
   - Set solution count to 0 or 11 → Should show error
   - Set max optimization time to 0 or 301 → Should show error

4. **Warnings:**
   - No employees → Warning (but allows submission)
   - No shifts in range → Warning (but allows submission)
   - No constraints → Warning (but allows submission)


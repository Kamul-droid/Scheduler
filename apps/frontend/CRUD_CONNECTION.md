# Frontend-Backend CRUD Connection Guide

This document describes how the frontend components connect to the backend REST API endpoints.

## API Base Configuration

- **Base URL**: Configured via `VITE_API_URL` environment variable (default: `http://localhost:3000`)
- **API Client**: Axios instance in `src/lib/api.ts`
- **State Management**: React Query for caching and mutations

## Component CRUD Operations

### 1. Employee Management

**Component**: `src/app/features/employees/EmployeeManagement.tsx`

**Hooks Used**:
- `useEmployees()` - Fetches all employees
- `useCreateEmployee()` - Creates new employee
- `useUpdateEmployee()` - Updates existing employee
- `useDeleteEmployee()` - Deletes employee

**Backend Endpoints**:
- `GET /employees` - List all employees
- `POST /employees` - Create employee
- `PATCH /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee

**Data Format**:
```typescript
{
  name: string;
  email: string;
  skills?: string[]; // Optional array
  availabilityPattern?: any; // Optional JSON
  metadata?: any; // Optional JSON
}
```

### 2. Constraint Management

**Component**: `src/app/features/constraints/ConstraintManagement.tsx`

**Hooks Used**:
- `useConstraints()` - Fetches all constraints
- `useActiveConstraints()` - Fetches active constraints only
- `useCreateConstraint()` - Creates new constraint
- `useUpdateConstraint()` - Updates existing constraint
- `useDeleteConstraint()` - Deletes constraint

**Backend Endpoints**:
- `GET /constraints` - List all constraints
- `GET /constraints/active` - List active constraints
- `POST /constraints` - Create constraint
- `PATCH /constraints/:id` - Update constraint
- `DELETE /constraints/:id` - Delete constraint

**Data Format**:
```typescript
{
  type: 'max_hours' | 'min_rest' | 'fair_distribution' | 'skill_requirement' | 'availability' | 'max_consecutive_days' | 'min_consecutive_days';
  rules: object; // JSON object with constraint-specific rules
  priority: number; // 0-100
  active?: boolean; // Default: true
}
```

**Constraint Types**:
- `max_hours` - Maximum working hours
- `min_rest` - Minimum rest between shifts
- `fair_distribution` - Fair workload distribution
- `skill_requirement` - Skill matching requirements
- `availability` - Employee availability constraints
- `max_consecutive_days` - Maximum consecutive working days
- `min_consecutive_days` - Minimum consecutive working days

### 3. Schedule Management

**Component**: `src/app/features/scheduler/SchedulerView.tsx`

**Hooks Used**:
- `useSchedules()` - Fetches all schedules
- `useCreateSchedule()` - Creates new schedule
- `useUpdateSchedule()` - Updates existing schedule
- `useDeleteSchedule()` - Deletes schedule

**Backend Endpoints**:
- `GET /schedules` - List all schedules
- `POST /schedules` - Create schedule
- `PATCH /schedules/:id` - Update schedule
- `DELETE /schedules/:id` - Delete schedule

**Data Format**:
```typescript
{
  employeeId: string; // UUID
  shiftId?: string; // Optional UUID
  startTime: string; // ISO 8601 datetime string
  endTime: string; // ISO 8601 datetime string
  status?: 'confirmed' | 'tentative' | 'conflict'; // Default: 'tentative'
  metadata?: any; // Optional JSON
}
```

### 4. Optimization

**Component**: `src/app/features/scheduler/OptimizationPanel.tsx`

**API Methods**:
- `optimizationApi.optimize()` - Start optimization
- `optimizationApi.getStatus()` - Get optimization status

**Backend Endpoints**:
- `POST /optimization` - Start optimization
- `GET /optimization/:id` - Get optimization status

**Request Format**:
```typescript
{
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  employeeIds?: string[]; // Optional filter
  departmentIds?: string[]; // Optional filter
  options?: {
    maxSolutions?: number;
    timeLimit?: number; // seconds
    objective?: 'minimize_cost' | 'maximize_fairness' | 'balance';
    allowOvertime?: boolean;
  };
}
```

## Error Handling

All API calls include error handling:
- Network errors are caught and displayed to users
- Validation errors from the backend are shown
- Failed mutations show alert messages
- Console logging for debugging

## Data Flow

1. **Read Operations**: 
   - Components use `useQuery` hooks
   - Data is cached by React Query
   - Automatic refetch on window focus (disabled by default)

2. **Write Operations**:
   - Components use `useMutation` hooks
   - On success, related queries are invalidated
   - UI updates automatically via cache invalidation

3. **Optimistic Updates**:
   - Currently not implemented (can be added if needed)
   - All updates wait for server confirmation

## Testing the Connection

1. Ensure backend is running on port 3000
2. Check browser console for API errors
3. Use browser DevTools Network tab to inspect requests
4. Verify CORS is enabled on backend (should be configured)

## Common Issues

1. **CORS Errors**: Backend must allow frontend origin
2. **404 Errors**: Check API base URL in environment variables
3. **Validation Errors**: Check data format matches backend DTOs
4. **Network Errors**: Verify backend is running and accessible


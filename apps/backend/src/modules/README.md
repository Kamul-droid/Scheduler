# Data Models & DTOs Documentation

This document describes all data models (entities) and Data Transfer Objects (DTOs) used in the backend application.

## Overview

The backend uses a combination of:
- **GraphQL Entities**: Type-safe GraphQL types for API responses
- **DTOs**: Data Transfer Objects for input validation and type safety
- **TypeScript Interfaces**: Shared type definitions
- **Enums**: Type-safe enumerations

## Common Types

### Enums

#### ScheduleStatus
**Location**: `common/types/schedule-status.enum.ts`

```typescript
enum ScheduleStatus {
  CONFIRMED = 'confirmed',
  TENTATIVE = 'tentative',
  CONFLICT = 'conflict',
  CANCELLED = 'cancelled',
}
```

**Usage**: Status of schedule assignments

#### ConstraintType
**Location**: `common/types/constraint-type.enum.ts`

```typescript
enum ConstraintType {
  MAX_HOURS = 'max_hours',
  MIN_REST = 'min_rest',
  FAIR_DISTRIBUTION = 'fair_distribution',
  SKILL_REQUIREMENT = 'skill_requirement',
  AVAILABILITY = 'availability',
  MAX_CONSECUTIVE_DAYS = 'max_consecutive_days',
  MIN_CONSECUTIVE_DAYS = 'min_consecutive_days',
}
```

**Usage**: Types of constraint rules

### Interfaces

#### Skill
**Location**: `common/types/skill.interface.ts`

```typescript
interface Skill {
  id: string;
  name: string;
  category?: string;
  certification?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}
```

**Usage**: Employee skills and certifications

#### AvailabilityWindow & AvailabilityPattern
**Location**: `common/types/availability-window.interface.ts`

```typescript
interface AvailabilityWindow {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone?: string;
}

interface AvailabilityPattern {
  type: 'weekly' | 'custom';
  windows: AvailabilityWindow[];
  exceptions?: {
    date: string; // ISO date
    available: boolean;
  }[];
}
```

**Usage**: Employee availability patterns

## Entities (GraphQL Types)

### Employee

**Location**: `modules/employees/entities/employee.entity.ts`

**GraphQL Type**: `Employee`

**Fields**:
- `id: ID!` - Unique identifier (UUID)
- `name: String!` - Employee name
- `email: String!` - Email address
- `skills: JSON` - Array of Skill objects (JSONB)
- `availabilityPattern: JSON` - Availability pattern (JSONB)
- `metadata: JSON` - Flexible additional data (JSONB)
- `createdAt: DateTime!` - Creation timestamp
- `updatedAt: DateTime!` - Last update timestamp

**Example**:
```graphql
type Employee {
  id: "550e8400-e29b-41d4-a716-446655440000"
  name: "John Doe"
  email: "john.doe@example.com"
  skills: [
    { "id": "skill1", "name": "ICU Nursing", "level": "expert" },
    { "id": "skill2", "name": "Pediatrics", "level": "advanced" }
  ]
  availabilityPattern: {
    "type": "weekly",
    "windows": [
      { "dayOfWeek": 1, "startTime": "08:00", "endTime": "16:00" }
    ]
  }
  createdAt: "2024-01-01T00:00:00Z"
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### Schedule

**Location**: `modules/schedules/entities/schedule.entity.ts`

**GraphQL Type**: `Schedule`

**Fields**:
- `id: ID!` - Unique identifier (UUID)
- `employeeId: ID!` - Reference to Employee
- `shiftId: ID!` - Reference to Shift
- `startTime: DateTime!` - Schedule start time
- `endTime: DateTime!` - Schedule end time
- `status: ScheduleStatus!` - Status enum
- `metadata: JSON` - Flexible additional data (JSONB)
- `createdAt: DateTime!` - Creation timestamp
- `updatedAt: DateTime!` - Last update timestamp

**Example**:
```graphql
type Schedule {
  id: "550e8400-e29b-41d4-a716-446655440000"
  employeeId: "emp-123"
  shiftId: "shift-456"
  startTime: "2024-01-15T08:00:00Z"
  endTime: "2024-01-15T16:00:00Z"
  status: CONFIRMED
  createdAt: "2024-01-01T00:00:00Z"
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### Shift

**Location**: `modules/shifts/entities/shift.entity.ts`

**GraphQL Type**: `Shift`

**Fields**:
- `id: ID!` - Unique identifier (UUID)
- `departmentId: ID!` - Reference to Department
- `requiredSkills: JSON` - Array of required Skill objects (JSONB)
- `minStaffing: Int!` - Minimum number of staff required
- `maxStaffing: Int!` - Maximum number of staff allowed
- `startTime: DateTime!` - Shift start time
- `endTime: DateTime!` - Shift end time
- `metadata: JSON` - Flexible additional data (JSONB)
- `createdAt: DateTime!` - Creation timestamp
- `updatedAt: DateTime!` - Last update timestamp

### Constraint

**Location**: `modules/constraints/entities/constraint.entity.ts`

**GraphQL Type**: `Constraint`

**Fields**:
- `id: ID!` - Unique identifier (UUID)
- `type: ConstraintType!` - Type of constraint
- `rules: JSON!` - Constraint rules (JSONB)
- `priority: Int!` - Priority (0-100)
- `active: Boolean!` - Whether constraint is active
- `createdAt: DateTime!` - Creation timestamp
- `updatedAt: DateTime!` - Last update timestamp

**Example Rules by Type**:

**Max Hours**:
```json
{
  "maxHoursPerWeek": 40,
  "maxHoursPerDay": 12
}
```

**Min Rest**:
```json
{
  "minRestHours": 11
}
```

**Fair Distribution**:
```json
{
  "shiftType": "weekend",
  "distributionMethod": "equal"
}
```

### Department

**Location**: `modules/departments/entities/department.entity.ts`

**GraphQL Type**: `Department`

**Fields**:
- `id: ID!` - Unique identifier (UUID)
- `name: String!` - Department name
- `requirements: JSON` - Department requirements (JSONB)
- `createdAt: DateTime!` - Creation timestamp
- `updatedAt: DateTime!` - Last update timestamp

## DTOs (Data Transfer Objects)

### Employee DTOs

#### CreateEmployeeDto
**Location**: `modules/employees/dto/create-employee.dto.ts`

**Validation Rules**:
- `name`: Required, string
- `email`: Required, valid email format
- `skills`: Optional, array
- `availabilityPattern`: Optional, object
- `metadata`: Optional, object

**Example**:
```typescript
{
  name: "John Doe",
  email: "john.doe@example.com",
  skills: [
    { id: "skill1", name: "ICU Nursing", level: "expert" }
  ],
  availabilityPattern: {
    type: "weekly",
    windows: [
      { dayOfWeek: 1, startTime: "08:00", endTime: "16:00" }
    ]
  }
}
```

#### UpdateEmployeeDto
**Location**: `modules/employees/dto/update-employee.dto.ts`

All fields are optional (extends PartialType of CreateEmployeeDto).

### Schedule DTOs

#### CreateScheduleDto
**Location**: `modules/schedules/dto/create-schedule.dto.ts`

**Validation Rules**:
- `employeeId`: Required, valid UUID
- `shiftId`: Required, valid UUID
- `startTime`: Required, valid ISO date string
- `endTime`: Required, valid ISO date string
- `status`: Optional, ScheduleStatus enum
- `metadata`: Optional, object

**Example**:
```typescript
{
  employeeId: "550e8400-e29b-41d4-a716-446655440000",
  shiftId: "660e8400-e29b-41d4-a716-446655440000",
  startTime: "2024-01-15T08:00:00Z",
  endTime: "2024-01-15T16:00:00Z",
  status: "tentative"
}
```

#### UpdateScheduleDto
**Location**: `modules/schedules/dto/update-schedule.dto.ts`

All fields are optional.

#### ScheduleConflict
**Location**: `modules/schedules/dto/schedule-conflict.dto.ts`

**Fields**:
- `type: String!` - Conflict type ('overlap', 'constraint_violation', 'skill_mismatch')
- `message: String!` - Human-readable message
- `details: JSON` - Additional conflict details

### Constraint DTOs

#### CreateConstraintDto
**Location**: `modules/constraints/dto/create-constraint.dto.ts`

**Validation Rules**:
- `type`: Required, ConstraintType enum
- `rules`: Required, object (validated by RuleEngineService)
- `priority`: Required, integer (0-100)
- `active`: Optional, boolean (default: true)

**Example - Max Hours Constraint**:
```typescript
{
  type: "max_hours",
  rules: {
    maxHoursPerWeek: 40,
    maxHoursPerDay: 12
  },
  priority: 10,
  active: true
}
```

**Example - Min Rest Constraint**:
```typescript
{
  type: "min_rest",
  rules: {
    minRestHours: 11
  },
  priority: 20,
  active: true
}
```

#### UpdateConstraintDto
**Location**: `modules/constraints/dto/update-constraint.dto.ts`

All fields are optional.

#### Constraint Rules Types
**Location**: `modules/constraints/dto/constraint-rules.dto.ts`

Type-safe interfaces for different constraint rule types:
- `MaxHoursRule`
- `MinRestRule`
- `FairDistributionRule`
- `SkillRequirementRule`
- `AvailabilityRule`
- `ConsecutiveDaysRule`

### Optimization DTOs

#### OptimizationRequestDto
**Location**: `modules/optimization/dto/optimization-request.dto.ts`

**Validation Rules**:
- `startDate`: Required, valid ISO date string
- `endDate`: Required, valid ISO date string
- `employeeIds`: Optional, array of UUIDs
- `departmentIds`: Optional, array of UUIDs
- `options`: Optional, optimization options object

**Example**:
```typescript
{
  startDate: "2024-01-01",
  endDate: "2024-01-31",
  employeeIds: ["emp-1", "emp-2"],
  departmentIds: ["dept-1"],
  options: {
    objective: "minimize_cost",
    allowOvertime: false,
    maxOptimizationTime: 300,
    solutionCount: 3
  }
}
```

#### OptimizationResult
**Location**: `modules/optimization/dto/optimization-result.dto.ts`

**Fields**:
- `optimizationId: String!` - Unique optimization request ID
- `status: OptimizationStatus!` - Status enum
- `solutions: [OptimizationSolution!]!` - Array of solution candidates
- `totalSolveTime: Int!` - Total optimization time in milliseconds
- `message: String` - Optional status message

**OptimizationSolution**:
- `id: String!` - Solution ID
- `score: Float!` - Solution quality score
- `assignments: [ScheduleAssignment!]!` - Schedule assignments
- `metrics: JSON` - Performance metrics
- `solveTime: Int!` - Time to generate this solution

**ScheduleAssignment**:
- `employeeId: ID!`
- `shiftId: ID!`
- `startTime: DateTime!`
- `endTime: DateTime!`

### Shift DTOs

#### CreateShiftDto
**Location**: `modules/shifts/dto/create-shift.dto.ts`

**Validation Rules**:
- `departmentId`: Required, valid UUID
- `requiredSkills`: Optional, array
- `minStaffing`: Required, integer >= 0
- `maxStaffing`: Required, integer >= 1
- `startTime`: Required, valid ISO date string
- `endTime`: Required, valid ISO date string
- `metadata`: Optional, object

#### UpdateShiftDto
**Location**: `modules/shifts/dto/update-shift.dto.ts`

All fields are optional.

### Department DTOs

#### CreateDepartmentDto
**Location**: `modules/departments/dto/create-department.dto.ts`

**Validation Rules**:
- `name`: Required, string
- `requirements`: Optional, object

#### UpdateDepartmentDto
**Location**: `modules/departments/dto/update-department.dto.ts`

All fields are optional.

## JSONB Fields

Several fields use JSONB (PostgreSQL) / JSON (GraphQL) for flexibility:

### Skills (Employee)
Stored as JSONB array:
```json
[
  {
    "id": "skill1",
    "name": "ICU Nursing",
    "category": "Medical",
    "certification": "CCRN",
    "level": "expert"
  }
]
```

### Availability Pattern (Employee)
Stored as JSONB object:
```json
{
  "type": "weekly",
  "windows": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "16:00",
      "timezone": "UTC"
    }
  ],
  "exceptions": [
    {
      "date": "2024-01-20",
      "available": false
    }
  ]
}
```

### Constraint Rules
Stored as JSONB with type-specific structure:
```json
{
  "maxHoursPerWeek": 40,
  "maxHoursPerDay": 12,
  "period": "week"
}
```

### Metadata Fields
Flexible JSONB for additional data:
```json
{
  "notes": "Preferred shift times",
  "preferences": {
    "shiftType": "day",
    "department": "ICU"
  }
}
```

## Validation

All DTOs use `class-validator` decorators for validation:

- `@IsString()` - String validation
- `@IsEmail()` - Email format validation
- `@IsUUID()` - UUID format validation
- `@IsDateString()` - ISO date string validation
- `@IsEnum()` - Enum value validation
- `@IsInt()`, `@Min()`, `@Max()` - Number validation
- `@IsOptional()` - Makes field optional
- `@IsArray()` - Array validation

Validation is automatically applied via the global `ValidationPipe` in `main.ts`.

## GraphQL Integration

### Scalar Types

The application uses `GraphQLJSON` from `graphql-scalars` for JSONB fields:
- Registered in `app.module.ts` as `JSON` scalar
- Allows flexible JSON data in GraphQL schema
- Type-safe on the backend, flexible on the frontend

### Enum Registration

Enums are registered with GraphQL:
```typescript
registerEnumType(ScheduleStatus, {
  name: 'ScheduleStatus',
  description: 'Status of a schedule assignment',
});
```

## Usage Examples

### Creating an Employee

**GraphQL Mutation**:
```graphql
mutation {
  createEmployee(createEmployeeInput: {
    name: "John Doe"
    email: "john@example.com"
    skills: [
      { id: "skill1", name: "ICU Nursing", level: "expert" }
    ]
  }) {
    id
    name
    email
  }
}
```

**REST API**:
```typescript
POST /employees
{
  "name": "John Doe",
  "email": "john@example.com",
  "skills": [...]
}
```

### Creating a Schedule

**GraphQL Mutation**:
```graphql
mutation {
  createSchedule(createScheduleInput: {
    employeeId: "emp-123"
    shiftId: "shift-456"
    startTime: "2024-01-15T08:00:00Z"
    endTime: "2024-01-15T16:00:00Z"
    status: TENTATIVE
  }) {
    id
    status
  }
}
```

### Triggering Optimization

**GraphQL Mutation**:
```graphql
mutation {
  optimizeSchedule(optimizationRequest: {
    startDate: "2024-01-01"
    endDate: "2024-01-31"
    options: {
      objective: "minimize_cost"
      solutionCount: 3
    }
  }) {
    optimizationId
    status
    solutions {
      score
      assignments {
        employeeId
        shiftId
      }
    }
  }
}
```

## Best Practices

1. **Always validate input**: Use DTOs with class-validator decorators
2. **Use enums for fixed values**: ScheduleStatus, ConstraintType
3. **Leverage JSONB flexibility**: For variable data structures (skills, rules, metadata)
4. **Type safety**: Use TypeScript interfaces for JSONB structures
5. **Document JSONB schemas**: Document expected structure in code comments

## File Structure

```
modules/
├── employees/
│   ├── entities/
│   │   └── employee.entity.ts
│   └── dto/
│       ├── create-employee.dto.ts
│       └── update-employee.dto.ts
├── schedules/
│   ├── entities/
│   │   └── schedule.entity.ts
│   └── dto/
│       ├── create-schedule.dto.ts
│       ├── update-schedule.dto.ts
│       └── schedule-conflict.dto.ts
├── constraints/
│   ├── entities/
│   │   └── constraint.entity.ts
│   └── dto/
│       ├── create-constraint.dto.ts
│       ├── update-constraint.dto.ts
│       └── constraint-rules.dto.ts
├── optimization/
│   └── dto/
│       ├── optimization-request.dto.ts
│       └── optimization-result.dto.ts
├── shifts/
│   ├── entities/
│   │   └── shift.entity.ts
│   └── dto/
│       ├── create-shift.dto.ts
│       └── update-shift.dto.ts
└── departments/
    ├── entities/
    │   └── department.entity.ts
    └── dto/
        ├── create-department.dto.ts
        └── update-department.dto.ts
```

## Related Documentation

- [GraphQL Schema Documentation](https://docs.nestjs.com/graphql/quick-start)
- [Class Validator](https://github.com/typestack/class-validator)
- [GraphQL Scalars](https://www.graphql-scalars.dev/)


# Database-First Architecture

## Overview

This backend follows a **database-first** approach where:
1. **Database schema** (PostgreSQL via Hasura migrations) is the **source of truth**
2. Backend DTOs and entities **reflect** the database schema
3. Backend services **transform** between API format (camelCase) and database format (snake_case)

## Architecture Flow

```
Frontend (camelCase)
    ↓
Backend REST/GraphQL API (camelCase DTOs)
    ↓
Backend Services (transform to snake_case)
    ↓
Hasura GraphQL Engine (snake_case queries)
    ↓
PostgreSQL Database (snake_case columns)
```

## Database Schema (Source of Truth)

The database schema is defined in `hasura/migrations/1734700000000_init/up.sql`:

### Employees Table
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    skills JSONB,                    -- nullable
    availability_pattern JSONB,      -- nullable
    metadata JSONB,                  -- nullable
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Constraints:**
- `name`: NOT NULL
- `email`: NOT NULL, UNIQUE
- `skills`, `availability_pattern`, `metadata`: nullable JSONB

### Departments Table
```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    requirements JSONB,              -- nullable
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Constraints:**
- `name`: NOT NULL, UNIQUE
- `requirements`: nullable JSONB

### Shifts Table
```sql
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    required_skills JSONB,           -- nullable
    min_staffing INTEGER NOT NULL DEFAULT 1,
    max_staffing INTEGER NOT NULL DEFAULT 1,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    metadata JSONB,                  -- nullable
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT shifts_time_check CHECK (end_time > start_time),
    CONSTRAINT shifts_staffing_check CHECK (max_staffing >= min_staffing)
);
```

**Constraints:**
- `department_id`: NOT NULL, foreign key
- `required_skills`: nullable JSONB
- `min_staffing`, `max_staffing`: NOT NULL, INTEGER
- `start_time`, `end_time`: NOT NULL, TIMESTAMPTZ
- `metadata`: nullable JSONB
- Check: `end_time > start_time`
- Check: `max_staffing >= min_staffing`

### Constraints Table
```sql
CREATE TABLE constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL CHECK (type IN ('max_hours', 'min_rest', 'fair_distribution', 'skill_requirement', 'availability', 'max_consecutive_days', 'min_consecutive_days')),
    rules JSONB NOT NULL,            -- NOT NULL
    priority INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Constraints:**
- `type`: NOT NULL, enum check
- `rules`: NOT NULL JSONB (important!)
- `priority`: NOT NULL, INTEGER, default 0
- `active`: NOT NULL, BOOLEAN, default true

### Schedules Table
```sql
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'tentative' CHECK (status IN ('confirmed', 'tentative', 'conflict')),
    metadata JSONB,                  -- nullable
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT schedules_time_check CHECK (end_time > start_time)
);
```

**Constraints:**
- `employee_id`, `shift_id`: NOT NULL, foreign keys
- `start_time`, `end_time`: NOT NULL, TIMESTAMPTZ
- `status`: NOT NULL, enum check, default 'tentative'
- `metadata`: nullable JSONB
- Check: `end_time > start_time`

## DTO Validation Rules

DTOs must enforce database constraints:

### CreateEmployeeDto
- ✅ `name`: Required (NOT NULL in DB)
- ✅ `email`: Required, valid email (NOT NULL, UNIQUE in DB)
- ✅ `skills`: Optional (nullable in DB)
- ✅ `availabilityPattern`: Optional (nullable in DB)
- ✅ `metadata`: Optional (nullable in DB)

### CreateDepartmentDto
- ✅ `name`: Required (NOT NULL, UNIQUE in DB)
- ✅ `requirements`: Optional (nullable in DB)

### CreateShiftDto
- ✅ `departmentId`: Required, UUID (NOT NULL, FK in DB)
- ✅ `requiredSkills`: Optional (nullable in DB)
- ✅ `minStaffing`: Required, integer >= 0 (NOT NULL in DB)
- ✅ `maxStaffing`: Required, integer >= 1 (NOT NULL in DB)
- ✅ `startTime`: Required, ISO date string (NOT NULL in DB)
- ✅ `endTime`: Required, ISO date string (NOT NULL in DB)
- ✅ `metadata`: Optional (nullable in DB)
- ⚠️ Validation: `endTime > startTime` (enforced by DB check)
- ⚠️ Validation: `maxStaffing >= minStaffing` (enforced by DB check)

### CreateConstraintDto
- ✅ `type`: Required, enum (NOT NULL, enum check in DB)
- ✅ `rules`: Required, object (NOT NULL in DB - **critical!**)
- ✅ `priority`: Required, integer 0-100 (NOT NULL in DB)
- ✅ `active`: Optional, boolean (NOT NULL, default true in DB)

### CreateScheduleDto
- ✅ `employeeId`: Required, UUID (NOT NULL, FK in DB)
- ✅ `shiftId`: Required, UUID (NOT NULL, FK in DB)
- ✅ `startTime`: Required, ISO date string (NOT NULL in DB)
- ✅ `endTime`: Required, ISO date string (NOT NULL in DB)
- ✅ `status`: Optional, enum (NOT NULL, default 'tentative' in DB)
- ✅ `metadata`: Optional (nullable in DB)
- ⚠️ Validation: `endTime > startTime` (enforced by DB check)

## Transformation Layer

Backend services transform between API format and database format:

### Example: Employee Service

**API Input (camelCase):**
```typescript
{
  name: "John Doe",
  email: "john@example.com",
  availabilityPattern: { type: "weekly", ... }
}
```

**Transformed to Database (snake_case):**
```graphql
mutation {
  insert_employees_one(object: {
    name: "John Doe"
    email: "john@example.com"
    availability_pattern: { type: "weekly", ... }
  }) { ... }
}
```

**Database Response (snake_case):**
```json
{
  "id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "availability_pattern": { ... },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Transformed to API (camelCase):**
```typescript
{
  id: "...",
  name: "John Doe",
  email: "john@example.com",
  availabilityPattern: { ... },
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z")
}
```

## Key Principles

1. **Database is Source of Truth**: All schema changes must start with database migrations
2. **DTOs Reflect Database**: DTO validation must match database constraints
3. **Transformation is Explicit**: Services explicitly transform between camelCase and snake_case
4. **No Schema Drift**: Backend code should not add constraints not in the database
5. **Validation Alignment**: ValidationPipe enforces database constraints, not additional business rules

## Adding New Fields

To add a new field:

1. **Update Database Schema** (migration):
   ```sql
   ALTER TABLE employees ADD COLUMN new_field VARCHAR(255);
   ```

2. **Update Entity** (reflects database):
   ```typescript
   @Field()
   newField: string;
   ```

3. **Update DTO** (matches database constraints):
   ```typescript
   @Field()
   @IsString()
   @IsOptional() // if nullable in DB
   newField?: string;
   ```

4. **Update Service** (transform in queries):
   ```typescript
   // In create/update methods
   new_field: createDto.newField || null
   ```

5. **Update Transformation** (map response):
   ```typescript
   private transformEmployee(dbResult: any): Employee {
     return {
       // ...
       newField: dbResult.new_field,
     };
   }
   ```

## Common Pitfalls

1. ❌ **Adding validation not in database**: Don't add `@Min()` if DB doesn't enforce it
2. ❌ **Making required fields optional**: If DB has `NOT NULL`, DTO must require it
3. ❌ **Forgetting transformation**: Always transform camelCase ↔ snake_case
4. ❌ **Schema drift**: Don't add fields to DTOs without database migration
5. ❌ **Wrong nullability**: Match DTO optionality to database nullability


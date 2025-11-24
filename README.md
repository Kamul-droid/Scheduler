# Resource Scheduler - Architecture Documentation

## Overview

This document defines the ground architecture for the **Resource Scheduler** application - a full-stack scheduling and resource allocation system designed for complex data visualization, constraint optimization, and on-premise deployment.

## Architecture Principles

1. **Simplicity over complexity**: Pragmatic architecture decisions
2. **Data scalability**: Optimized for handling large, complex datasets
3. **On-premise deployment**: Docker Compose-based, infrastructure-agnostic
4. **Developer experience**: Easy local development with minimal setup
5. **Reliability and availability**: High-quality, tested solutions with comprehensive testing strategies

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React Frontend (TypeScript + Vite + Tailwind CSS)  │  │
│  │  - Apollo Client (GraphQL queries)                   │  │
│  │  - React Query (REST API state management)           │  │
│  │  - GraphQL Codegen (Type-safe queries)              │  │
│  │  - Seed Script (Automatic test data generation)     │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ GraphQL / REST
┌───────────────────────┴─────────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Hasura 2.36.0 (GraphQL Engine)                      │  │
│  │  - Auto-generated GraphQL API                         │  │
│  │  - Real-time subscriptions                            │  │
│  │  - Permission management                              │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                   Application Layer                          │
│  ┌──────────────────────┐  ┌─────────────────────────────┐ │
│  │  NestJS Backend      │  │  Python Optimization Service│ │
│  │  - GraphQL Resolvers │  │  - OR-Tools CP-SAT Solver  │ │
│  │  - REST Controllers  │  │  - Constraint Solvers       │ │
│  │  - Business Logic    │  │  - Schedule Optimization   │ │
│  │  - Validation        │  │  - Conflict Detection      │ │
│  └──────────────────────┘  └─────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                    Data Layer                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL 15 (Database)                           │  │
│  │  - Employee/Resource data                            │  │
│  │  - Schedule assignments                              │  │
│  │  - Constraints & rules                               │  │
│  │  - Historical data                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```text
resource-scheduler/
├── apps/
│   ├── frontend/              # React + Vite application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── components/     # Reusable UI components
│   │   │   │   ├── features/       # Feature modules
│   │   │   │   │   ├── scheduler/  # Scheduler feature
│   │   │   │   │   ├── employees/  # Employee management
│   │   │   │   │   └── constraints/ # Constraint management
│   │   │   │   ├── hooks/          # Custom React hooks
│   │   │   │   └── lib/            # Utilities and API clients
│   │   │   └── graphql/            # Generated GraphQL types
│   │   ├── scripts/
│   │   │   └── seed-backend.js     # Database seeding script
│   │   ├── cypress/                # E2E tests
│   │   │   ├── e2e/                # Test specs
│   │   │   ├── fixtures/           # Test data
│   │   │   └── support/            # Test helpers and commands
│   │   └── package.json
│   │
│   ├── backend/               # NestJS application
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── employees/      # Employee module
│   │   │   │   ├── schedules/      # Schedule module
│   │   │   │   ├── constraints/    # Constraint module
│   │   │   │   └── optimization/   # Optimization module
│   │   │   ├── common/             # Shared utilities and types
│   │   │   └── config/             # Configuration
│   │   └── test/                   # Integration tests
│   │
│   └── optimizer/             # Python optimization service
│       ├── src/
│       │   ├── solvers/            # OR-Tools solvers
│       │   │   └── optimization_engine.py # CP-SAT solver
│       │   ├── models/             # Optimization models
│       │   │   ├── employee_model.py
│       │   │   ├── schedule_model.py
│       │   │   └── constraint_model.py
│       │   └── api/                # FastAPI REST endpoints
│       └── requirements.txt
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.backend
│   │   └── Dockerfile.optimizer
│   ├── docker-compose.yml    # Local development
│   └── init-db/              # Database initialization scripts
│
├── hasura/
│   ├── migrations/            # Database migrations
│   └── metadata/              # Hasura metadata
│
└── README.md
```

## Component Architecture

### 1. Frontend Layer (React + TypeScript + Vite)

**Technology Stack:**

- **React 18**: Component-based UI framework
- **TypeScript 5.5**: Type-safe development
- **Vite 5.4**: Fast build tool and dev server
- **Tailwind CSS 3.4**: Utility-first styling (responsive by default)
- **Apollo Client 3.8**: GraphQL client for queries and mutations
- **React Query 5.12**: REST API state management and caching
- **React Router 6.20**: Client-side routing
- **GraphQL Codegen 5.0**: Type-safe GraphQL queries and mutations
- **Cypress 13.6**: End-to-end testing
- **Vitest 1.0**: Unit testing framework
- **ESLint 9.0**: Code linting (with legacy peer deps support)

**Key Components:**

```text
Frontend Structure:
├── SchedulerView
│   ├── Timeline (Week/Month view)
│   ├── ResourceList (Employee list)
│   ├── ScheduleGrid
│   └── ConflictIndicator
│
├── EmployeeManagement
│   ├── EmployeeList
│   ├── EmployeeForm
│   └── SkillMatrix
│
├── ConstraintManagement
│   ├── ConstraintEditor
│   ├── RuleBuilder
│   └── ValidationPanel
│
└── OptimizationPanel
    ├── OptimizationControls
    ├── SolutionPreview
    └── OptimizationResults
```

**Responsibilities:**

- Render interactive scheduling timeline
- Display real-time conflict detection and validation feedback
- Handle user interactions (assignments, edits, constraints)
- Visualize optimization results and coverage gaps
- Responsive design for various screen sizes
- Automatic test data seeding on container startup

**API Communication:**

- **REST API**: Uses Axios with relative URLs (via Vite proxy)
- **GraphQL**: Uses Apollo Client with relative URLs (via Vite proxy)
- **Proxy Configuration**: Vite dev server proxies all API calls to backend
- **Environment Variables**: `VITE_BACKEND_URL`, `VITE_HASURA_URL`, `VITE_HASURA_ADMIN_SECRET`

### 2. API Gateway Layer (Hasura)

**Technology Stack:**

- **Hasura 2.36.0**: GraphQL engine on PostgreSQL
- **GraphQL**: Unified API interface
- **Real-time subscriptions**: Live schedule updates

**Responsibilities:**

- Auto-generate GraphQL API from PostgreSQL schema
- Handle authentication and authorization
- Provide real-time subscriptions for schedule changes
- Manage database relationships and permissions
- Expose REST endpoints for optimization service

**GraphQL Schema Highlights:**

```graphql
type Employee {
  id: ID!
  name: String!
  email: String!
  skills: JSON
  availabilityPattern: JSON
  schedules: [Schedule!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Schedule {
  id: ID!
  employeeId: ID!
  shiftId: ID!
  startTime: DateTime!
  endTime: DateTime!
  status: ScheduleStatus!
  metadata: JSON
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Constraint {
  id: ID!
  type: ConstraintType!
  rules: JSON!
  priority: Int!
  active: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum ConstraintType {
  max_hours
  min_rest
  fair_distribution
  skill_requirement
  availability
  max_consecutive_days
  min_consecutive_days
}
```

### 3. Application Layer

#### 3.1 NestJS Backend

**Technology Stack:**

- **NestJS**: TypeScript backend framework
- **Node.js 20**: Runtime environment
- **GraphQL**: Resolvers for custom business logic
- **REST APIs**: Integration with optimization service
- **Hasura Client**: Direct database access via Hasura GraphQL

**Module Structure:**

```text
Backend Modules:
├── EmployeesModule
│   ├── EmployeeService
│   ├── EmployeeResolver (GraphQL)
│   └── EmployeeController (REST)
│
├── SchedulesModule
│   ├── ScheduleService
│   ├── ScheduleResolver
│   ├── ConflictDetectionService
│   └── ValidationService
│
├── ConstraintsModule
│   ├── ConstraintService
│   ├── ConstraintResolver
│   └── RuleEngineService
│
└── OptimizationModule
    ├── OptimizationOrchestrator
    ├── OptimizationClient (REST client to Python service)
    └── OptimizationResolver
```

**API Endpoints:**

- **REST Endpoints**:
  - `POST /employees` - Create employee (201 Created)
  - `GET /employees` - List all employees (200 OK)
  - `GET /employees/:id` - Get employee by ID (200 OK)
  - `PATCH /employees/:id` - Update employee (200 OK)
  - `DELETE /employees/:id` - Delete employee (204 No Content)
  
  - `POST /constraints` - Create constraint (201 Created)
  - `GET /constraints` - List all constraints (200 OK)
  - `GET /constraints/active` - Get active constraints (200 OK)
  - `GET /constraints/:id` - Get constraint by ID (200 OK)
  - `PATCH /constraints/:id` - Update constraint (200 OK)
  - `DELETE /constraints/:id` - Delete constraint (204 No Content)
  
  - `POST /schedules` - Create schedule (201 Created)
  - `GET /schedules` - List all schedules (200 OK)
  - `GET /schedules/:id` - Get schedule by ID (200 OK)
  - `PATCH /schedules/:id` - Update schedule (200 OK)
  - `DELETE /schedules/:id` - Delete schedule (204 No Content)
  
  - `POST /optimization` - Start optimization (201 Created)
  - `GET /optimization/:id` - Get optimization status (200 OK)

**Responsibilities:**

- Business logic and validation
- Constraint checking and conflict detection
- Orchestration of optimization requests
- Integration with Python optimization service
- Custom GraphQL resolvers beyond Hasura capabilities
- Data transformation and aggregation

#### 3.2 Python Optimization Service

**Technology Stack:**

- **Python**: Optimization algorithms
- **OR-Tools CP-SAT**: Google's constraint programming solver
- **FastAPI**: REST API framework
- **Pydantic**: Data validation

**Service Structure:**

```text
Optimizer Service:
├── solvers/
│   └── optimization_engine.py # CP-SAT solver with integer constraints
│
├── models/
│   ├── employee_model.py
│   ├── schedule_model.py
│   └── constraint_model.py
│
└── api/
    └── routes.py               # REST endpoints
```

**API Endpoints:**

- `POST /optimize` - Start optimization job
- `GET /optimize/:id` - Get optimization status
- `GET /health` - Health check

**Responsibilities:**

- Solve complex scheduling optimization problems using CP-SAT
- Apply constraint satisfaction algorithms
- Balance workload distribution
- Generate optimal schedule assignments
- Handle skill matching and availability
- Return multiple solution candidates with metrics

**Optimization Algorithms:**

- **Constraint Programming (CP-SAT)**: For hard constraints (legal requirements, union rules)
- **Integer Linear Programming**: All time-based calculations use minutes (integers) for CP-SAT compatibility
- **Multi-objective optimization**: Cost minimization, fairness maximization, workload balancing

### 4. Data Layer (PostgreSQL)

**Database Schema Highlights:**

```sql
-- Core Tables
employees
├── id (UUID, PK)
├── name (VARCHAR)
├── email (VARCHAR, UNIQUE)
├── skills (JSONB)              -- Array of Skill objects
├── availability_pattern (JSONB) -- Recurring availability windows
├── metadata (JSONB)            -- Flexible additional data
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

schedules
├── id (UUID, PK)
├── employee_id (UUID, FK)
├── shift_id (UUID, FK)
├── start_time (TIMESTAMP)
├── end_time (TIMESTAMP)
├── status (ENUM)               -- confirmed, tentative, conflict
├── metadata (JSONB)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

shifts
├── id (UUID, PK)
├── department_id (UUID, FK)
├── required_skills (JSONB)     -- Array of required skills
├── min_staffing (INT)
├── max_staffing (INT)
├── start_time (TIMESTAMP)
├── end_time (TIMESTAMP)
├── metadata (JSONB)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

constraints
├── id (UUID, PK)
├── type (VARCHAR)              -- ConstraintType enum
├── rules (JSONB)               -- Flexible constraint definition
├── priority (INT)               -- 0-100
├── active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

departments
├── id (UUID, PK)
├── name (VARCHAR, UNIQUE)
├── requirements (JSONB)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Constraint Types and Rules:**

1. **max_hours** (`ConstraintType.MAX_HOURS`):
   ```json
   {
     "maxHoursPerWeek": 40,
     "maxHoursPerDay": 12,
     "periodInDays": 7
   }
   ```

2. **min_rest** (`ConstraintType.MIN_REST`):
   ```json
   {
     "minRestHours": 11,
     "applyToConsecutiveShifts": true
   }
   ```

3. **fair_distribution** (`ConstraintType.FAIR_DISTRIBUTION`):
   ```json
   {
     "maxShiftsPerEmployee": 20,
     "distributionMethod": "equal"
   }
   ```

4. **skill_requirement** (`ConstraintType.SKILL_REQUIREMENT`):
   ```json
   {
     "requiredSkills": ["ACLS", "BLS", "Emergency Medicine"]
   }
   ```

5. **availability** (`ConstraintType.AVAILABILITY`):
   ```json
   {
     "availabilityWindows": [
       {
         "dayOfWeek": 1,
         "startTime": "08:00",
         "endTime": "17:00"
       }
     ]
   }
   ```

6. **max_consecutive_days** (`ConstraintType.MAX_CONSECUTIVE_DAYS`):
   ```json
   {
     "maxDays": 5
   }
   ```

7. **min_consecutive_days** (`ConstraintType.MIN_CONSECUTIVE_DAYS`):
   ```json
   {
     "minDays": 3
   }
   ```

**Design Principles:**

- **JSONB columns**: Flexible schema for varying constraint types and metadata
- **UUID primary keys**: Better for distributed systems
- **Indexes**: Optimized for common queries (employee lookups, time-range queries)
- **Partitioning**: Consider time-based partitioning for historical schedules
- **Full-text search**: For employee skill matching

## Data Flow

### Schedule Creation Flow

```text
1. User Action (Frontend)
   ↓
2. REST API POST /schedules → NestJS Backend
   ↓
3. Backend → Conflict Detection Service
   ↓
4. Backend → Hasura → PostgreSQL (Insert)
   ↓
5. Real-time Subscription → Frontend (Update UI)
   ↓
6. If conflicts detected → Frontend Alert
```

### Optimization Flow

```text
1. User Triggers Optimization (Frontend)
   ↓
2. REST API POST /optimization → NestJS Backend
   ↓
3. NestJS → Collects current state (employees, shifts, constraints)
   ↓
4. NestJS → REST API Call → Python Optimization Service
   ↓
5. Python Service → OR-Tools CP-SAT Solver
   ↓
6. Python Service → Returns solution candidates with metrics
   ↓
7. NestJS → Validates solutions
   ↓
8. NestJS → REST Response → Frontend
   ↓
9. Frontend → Displays solution preview with metrics
   ↓
10. User Accepts → Apply to database via REST API
```

## Deployment Architecture

### Docker Compose Structure

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: resource-scheduler-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: scheduler
      POSTGRES_PASSWORD: scheduler
      POSTGRES_DB: scheduler
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U scheduler"]
      interval: 10s
      timeout: 5s
      retries: 5

  hasura:
    image: hasura/graphql-engine:v2.36.0
    container_name: resource-scheduler-hasura
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      HASURA_GRAPHQL_DATABASE_URL: postgres://scheduler:scheduler@postgres:5432/scheduler
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
      HASURA_GRAPHQL_ADMIN_SECRET: myadminsecretkey
    healthcheck:
      test: ["CMD-SHELL", "curl -f -s -m 3 http://localhost:8080/v1/version || exit 1"]
      interval: 20s
      timeout: 5s
      retries: 3
      start_period: 40s

  backend:
    build:
      context: ..
      dockerfile: infrastructure/docker/Dockerfile.backend
    container_name: resource-scheduler-backend
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      hasura:
        condition: service_healthy
      optimizer:
        condition: service_started
    environment:
      NODE_ENV: production
      PORT: 3000
      HASURA_URL: http://hasura:8080
      HASURA_ADMIN_SECRET: myadminsecretkey
      OPTIMIZER_SERVICE_URL: http://optimizer:8000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: scheduler
      DB_PASSWORD: scheduler
      DB_NAME: scheduler
    healthcheck:
      test: ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  optimizer:
    build:
      context: ..
      dockerfile: infrastructure/docker/Dockerfile.optimizer
    container_name: resource-scheduler-optimizer
    ports:
      - "8000:8000"
    environment:
      PYTHONUNBUFFERED: "1"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ..
      dockerfile: infrastructure/docker/Dockerfile.frontend
    container_name: resource-scheduler-frontend
    ports:
      - "3001:3001"
    depends_on:
      backend:
        condition: service_healthy
      postgres:
        condition: service_healthy
      hasura:
        condition: service_healthy
    environment:
      NODE_ENV: development
      VITE_BACKEND_URL: http://backend:3000
      VITE_HASURA_URL: http://hasura:8080
      VITE_HASURA_ADMIN_SECRET: myadminsecretkey
      SEED_BACKEND_STANDALONE: "true"
    volumes:
      # Hot reload in development
      - ../apps/frontend/src:/app/src:ro
      - ../apps/frontend/public:/app/public:ro
      - ../apps/frontend/index.html:/app/index.html:ro
      - ../apps/frontend/vite.config.ts:/app/vite.config.ts:ro
      # Seed script and test data
      - ../apps/frontend/scripts:/app/scripts:ro
      - ../apps/frontend/cypress/fixtures:/app/cypress/fixtures:ro
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3001 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  postgres_data:
    driver: local

networks:
  scheduler-network:
    driver: bridge
```

**Frontend Container Startup Process:**

1. Wait for backend to be ready (up to 120 seconds)
2. Start seed script in background (non-blocking)
3. Start Vite dev server as main process
4. Seed script logs available at `/tmp/seed.log`

**Docker Build Notes:**

- Frontend Dockerfile uses `--legacy-peer-deps` for npm ci to resolve ESLint 9 peer dependency conflicts
- All services use health checks for proper startup ordering
- Frontend runs in development mode with hot reload via volume mounts

## Testing Strategy

The testing strategy focuses on **End-to-end and API-level integration tests** to ensure reliability and availability of the system.

### Test Structure

```text
Testing:
├── E2E Tests (Cypress)
│   ├── scheduler-workflows.spec.ts
│   ├── optimization-flow.spec.ts
│   ├── constraint-validation.spec.ts
│   ├── employee-management.spec.ts
│   ├── platform-scenarios.spec.ts
│   └── navigation.spec.ts
│
├── Unit Tests (Vitest)
│   └── Component and utility tests
│
└── Integration Tests (NestJS)
    ├── schedule.service.spec.ts
    ├── constraint.service.spec.ts
    └── optimization.integration.spec.ts
```

### Testing Focus

- Critical user workflows (E2E)
- API contract validation
- Constraint validation logic
- Optimization service integration
- System reliability under load
- Service availability and recovery
- Data consistency and integrity

### Cypress E2E Testing

**Test Data Management:**

- **Seed Script**: `apps/frontend/scripts/seed-backend.js` - Comprehensive test data generation
- **Test Fixtures**: `apps/frontend/cypress/fixtures/test-data.json` - Validated test data
- **Custom Commands**: `apps/frontend/cypress/support/commands.ts` - Reusable test utilities

**Cypress Commands:**

- `cy.createEmployee(employee)` - Create employee via API (validates 201 response)
- `cy.createConstraint(constraint)` - Create constraint via API (validates 201 response)
- `cy.updateConstraint(id, updates)` - Update constraint via API (validates 200 response)
- `cy.deleteConstraint(id)` - Delete constraint via API (validates 204 response)
- `cy.createSchedule(schedule)` - Create schedule via API (validates 201 response)
- `cy.clearTestData()` - Clean up all test data (handles 204 responses)
- `cy.seedTestData()` - Seed basic test data
- `cy.seedPlatformData()` - Seed comprehensive platform data

**Test Coverage:**

- Constraint CRUD operations with proper API response validation
- Employee management workflows
- Schedule creation and conflict detection
- Optimization flow with solution application
- Form validation and error handling
- Responsive design validation

## Performance Considerations

### Frontend Performance

- **Vite**: Fast HMR and optimized production builds
- **GraphQL Codegen**: Type-safe, optimized queries
- **Query caching**: React Query and Apollo Client caching
- **Lazy loading**: Code splitting for feature modules
- **Responsive rendering**: Optimize for quick decision-making

### Backend Performance

- **Database indexing**: Optimize for time-range queries and employee lookups
- **Query optimization**: Efficient GraphQL resolvers
- **Caching**: Consider Redis for frequently accessed constraint rules
- **Background processing**: Async optimization jobs for large schedules

### Optimization Service Performance

- **CP-SAT Solver**: Efficient constraint programming for scheduling problems
- **Integer constraints**: All time calculations use minutes (integers) for solver compatibility
- **Solution caching**: Cache optimization results for similar inputs
- **Timeout handling**: Configurable timeouts for large problems

### Data Scalability

- **Pagination**: For large employee lists and historical schedules
- **Time-based partitioning**: For historical schedule data
- **Materialized views**: For complex aggregations (coverage analysis)
- **Batch operations**: For bulk schedule updates

## Security Considerations

### On-Premise Deployment

- **Data isolation**: Each customer has separate database instance
- **Network security**: Intranet-only access
- **Authentication**: JWT tokens, role-based access control (via Hasura)
- **Data encryption**: At rest and in transit
- **Audit logging**: Track all schedule changes and optimizations

### Environment Variables

- **Backend**: `HASURA_ADMIN_SECRET`, `DB_PASSWORD`, `OPTIMIZER_SERVICE_URL`
- **Frontend**: `VITE_HASURA_ADMIN_SECRET`, `VITE_BACKEND_URL`, `VITE_HASURA_URL`
- **Hasura**: `HASURA_GRAPHQL_ADMIN_SECRET`, `HASURA_GRAPHQL_DATABASE_URL`

## Development Workflow

### Local Development

1. **Docker Compose up**: All services run locally
   ```bash
   cd infrastructure
   docker-compose up --build
   ```

2. **Frontend Development**:
   - Frontend runs on port 3001
   - Vite dev server with hot reload
   - Seed script runs automatically on container startup
   - Access at `http://localhost:3001`

3. **Backend Development**:
   - Backend runs on port 3000
   - NestJS with hot reload (if configured)
   - Access at `http://localhost:3000`

4. **Database Migrations**: Hasura CLI for schema changes

5. **Type Generation**: GraphQL Codegen watches for schema changes

### Code Generation

- **GraphQL Codegen**: Auto-generate TypeScript types from GraphQL schema
- **Hasura migrations**: Version-controlled database schema
- **Seed Script**: Generate test data for development and testing

### Running Tests

```bash
# Frontend E2E tests
cd apps/frontend
npm run test:e2e

# Frontend unit tests
npm run test

# Backend tests
cd apps/backend
npm run test
```

## Monitoring & Observability

- **Health Checks**: All services expose `/health` endpoints
- **Logging**: Structured logging across services
- **Error tracking**: Centralized error monitoring
- **Performance metrics**: Query performance, optimization solve times

## Key Architectural Decisions

1. **Hasura for GraphQL**: Reduces boilerplate, auto-generates API
2. **Separate Python service**: OR-Tools is Python-native, keeps optimization isolated
3. **Vite for Frontend**: Fast development experience and optimized builds
4. **Docker Compose**: Simple deployment, no Kubernetes complexity
5. **JSONB for constraints**: Flexible schema for varying constraint types
6. **REST for optimization**: Simple integration between NestJS and Python service
7. **CP-SAT Solver**: Integer-based constraint programming for scheduling problems
8. **Seed Script Integration**: Automatic test data generation on frontend startup
9. **Cypress E2E Testing**: Comprehensive end-to-end test coverage with API validation

## API Response Specifications

### Success Responses

- **POST**: Returns `201 Created` with full entity object
- **GET**: Returns `200 OK` with data (array or object)
- **PATCH**: Returns `200 OK` with updated entity object
- **DELETE**: Returns `204 No Content` (no response body)

### Error Responses

- **400 Bad Request**: Validation errors or invalid input
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate constraint type)
- **500 Internal Server Error**: Server errors

## Conclusion

This architecture prioritizes:

- **Simplicity**: Straightforward, maintainable structure
- **Pragmatism**: Proven technologies, minimal complexity
- **Data scalability**: Optimized for complex datasets, not user scaling
- **Developer experience**: Easy local development, clear structure
- **Reliability and Availability**: Comprehensive testing strategies ensuring system stability and uptime

The architecture addresses the complex requirements of resource scheduling, optimization, and data visualization while maintaining high standards for reliability, availability, and maintainability.

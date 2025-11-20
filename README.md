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
│  │  React Frontend (TypeScript + Tailwind CSS)          │  │
│  │  - Bryntum Scheduler Pro (Timeline Visualization)   │  │
│  │  - GraphQL Codegen (Type-safe queries)              │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ GraphQL / REST
┌───────────────────────┴─────────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Hasura 2.x (GraphQL Engine)                         │  │
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
│  │  - GraphQL Resolvers │  │  - OR-Tools Integration     │ │
│  │  - REST Controllers  │  │  - Constraint Solvers       │ │
│  │  - Business Logic    │  │  - Schedule Optimization   │ │
│  │  - Validation        │  │  - Conflict Detection      │ │
│  └──────────────────────┘  └─────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                    Data Layer                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                 │  │
│  │  - Employee/Resource data                            │  │
│  │  - Schedule assignments                              │  │
│  │  - Constraints & rules                               │  │
│  │  - Historical data                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Monorepo Structure (Nx)

```text
resource-scheduler/
├── apps/
│   ├── frontend/              # React application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── components/     # React components
│   │   │   │   ├── features/       # Feature modules
│   │   │   │   │   ├── scheduler/  # Scheduler feature
│   │   │   │   │   ├── employees/  # Employee management
│   │   │   │   │   └── constraints/ # Constraint management
│   │   │   │   ├── hooks/          # Custom React hooks
│   │   │   │   └── lib/            # Utilities
│   │   │   └── graphql/            # Generated GraphQL types
│   │   └── cypress/                # E2E tests
│   │
│   ├── backend/               # NestJS application
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── employees/      # Employee module
│   │   │   │   ├── schedules/      # Schedule module
│   │   │   │   ├── constraints/    # Constraint module
│   │   │   │   └── optimization/   # Optimization module
│   │   │   ├── common/             # Shared utilities
│   │   │   └── config/             # Configuration
│   │   └── test/                   # Integration tests
│   │
│   └── optimizer/             # Python optimization service
│       ├── src/
│       │   ├── solvers/            # OR-Tools solvers
│       │   ├── models/             # Optimization models
│       │   └── api/                # REST API endpoints
│       └── requirements.txt
│
├── libs/
│   ├── shared/               # Shared TypeScript utilities
│   ├── graphql/              # GraphQL schema & codegen config
│   └── types/                # Shared TypeScript types
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.backend
│   │   └── Dockerfile.optimizer
│   ├── docker-compose.yml    # Local development
│   ├── docker-compose.prod.yml # Production template
│   └── terraform/             # Deployment automation
│
├── hasura/
│   ├── migrations/            # Database migrations
│   ├── metadata/              # Hasura metadata
│   └── config.yaml            # Hasura configuration
│
├── nx.json                    # Nx workspace configuration
├── package.json
└── README.md
```

## Component Architecture

### 1. Frontend Layer (React + TypeScript)

**Technology Stack:**

- **React**: Component-based UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling (responsive by default)
- **Bryntum Scheduler Pro**: Advanced scheduling timeline component
- **GraphQL Codegen**: Type-safe GraphQL queries and mutations
- **React Query / Apollo Client**: Data fetching and caching

**Key Components:**

```text
Frontend Structure:
├── SchedulerView
│   ├── Timeline (Bryntum Scheduler Pro)
│   ├── ResourceList
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

- Render interactive scheduling timeline with drag-and-drop
- Display real-time conflict detection and validation feedback
- Handle user interactions (assignments, edits, constraints)
- Visualize optimization results and coverage gaps
- Responsive design for various screen sizes

### 2. API Gateway Layer (Hasura)

**Technology Stack:**

- **Hasura 2.x**: GraphQL engine on PostgreSQL
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
  skills: [Skill!]!
  availability: [AvailabilityWindow!]!
  schedules: [Schedule!]!
}

type Schedule {
  id: ID!
  employee: Employee!
  shift: Shift!
  startTime: DateTime!
  endTime: DateTime!
  status: ScheduleStatus!
}

type Constraint {
  id: ID!
  type: ConstraintType!
  rules: JSON!
  priority: Int!
}
```

### 3. Application Layer

#### 3.1 NestJS Backend

**Technology Stack:**

- **NestJS**: TypeScript backend framework
- **GraphQL**: Resolvers for custom business logic
- **REST APIs**: Integration with optimization service
- **TypeORM / Prisma**: Database ORM (optional, Hasura handles most)

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
- **OR-Tools**: Google's optimization library
- **FastAPI / Flask**: REST API (pragmatic choice)
- **Pydantic**: Data validation

**Service Structure:**

```text
Optimizer Service:
├── solvers/
│   ├── schedule_solver.py      # Main scheduling solver
│   ├── constraint_solver.py   # Constraint satisfaction
│   └── optimization_engine.py # OR-Tools integration
│
├── models/
│   ├── employee_model.py
│   ├── schedule_model.py
│   └── constraint_model.py
│
└── api/
    └── routes.py               # REST endpoints
```

**Responsibilities:**

- Solve complex scheduling optimization problems
- Apply constraint satisfaction algorithms
- Balance workload distribution
- Generate optimal schedule assignments
- Handle skill matching and availability
- Return multiple solution candidates

**Optimization Algorithms:**

- **Constraint Programming (CP)**: For hard constraints (legal requirements, union rules)
- **Linear Programming (LP)**: For optimization objectives (cost, fairness)
- **Metaheuristics**: For large-scale problems

### 4. Data Layer (PostgreSQL)

**Database Schema Highlights:**

```sql
-- Core Tables
employees
├── id (UUID, PK)
├── name (VARCHAR)
├── email (VARCHAR)
├── skills (JSONB)              -- Array of certifications/specializations
├── availability_pattern (JSONB) -- Recurring availability
└── metadata (JSONB)            -- Flexible additional data

schedules
├── id (UUID, PK)
├── employee_id (UUID, FK)
├── shift_id (UUID, FK)
├── start_time (TIMESTAMP)
├── end_time (TIMESTAMP)
├── status (ENUM)               -- confirmed, tentative, conflict
└── metadata (JSONB)

shifts
├── id (UUID, PK)
├── department_id (UUID, FK)
├── required_skills (JSONB)     -- Required certifications
├── min_staffing (INT)
├── max_staffing (INT)
└── time_window (TSTZRANGE)

constraints
├── id (UUID, PK)
├── type (VARCHAR)              -- max_hours, min_rest, fair_distribution
├── rules (JSONB)               -- Flexible constraint definition
├── priority (INT)
└── active (BOOLEAN)

departments
├── id (UUID, PK)
├── name (VARCHAR)
└── requirements (JSONB)
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
2. GraphQL Mutation → Hasura
   ↓
3. Hasura → PostgreSQL (Insert/Update)
   ↓
4. Real-time Subscription → Frontend (Update UI)
   ↓
5. Background: Conflict Detection (NestJS)
   ↓
6. If conflicts detected → Frontend Alert
```

### Optimization Flow

```text
1. User Triggers Optimization (Frontend)
   ↓
2. GraphQL Mutation → NestJS Backend
   ↓
3. NestJS → Collects current state (employees, shifts, constraints)
   ↓
4. NestJS → REST API Call → Python Optimization Service
   ↓
5. Python Service → OR-Tools Solver
   ↓
6. Python Service → Returns solution candidates
   ↓
7. NestJS → Validates solutions
   ↓
8. NestJS → GraphQL Response → Frontend
   ↓
9. Frontend → Displays solution preview
   ↓
10. User Accepts → Apply to database via Hasura
```

## Deployment Architecture

### Docker Compose Structure

```yaml
services:
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: scheduler
      POSTGRES_USER: scheduler
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  hasura:
    image: hasura/graphql-engine:v2.x
    depends_on:
      - postgres
    environment:
      HASURA_GRAPHQL_DATABASE_URL: postgres://...
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
    ports:
      - "8080:8080"

  backend:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.backend
    depends_on:
      - postgres
      - hasura
    environment:
      DATABASE_URL: postgres://...
      HASURA_URL: http://hasura:8080
    ports:
      - "3000:3000"

  optimizer:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.optimizer
    depends_on:
      - backend
    ports:
      - "8000:8000"

  frontend:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.frontend
    depends_on:
      - backend
      - hasura
    ports:
      - "80:80"
    # Or serve via nginx in production

volumes:
  postgres_data:
```

### Terraform Deployment

- **Customer-specific configurations**: Environment variables, database credentials
- **Infrastructure provisioning**: VMs, networking (if needed)
- **Standardized images**: Same Docker images for all customers
- **Configuration management**: Customer-specific settings via Terraform variables

## Testing Strategy

The testing strategy focuses on **End-to-end and API-level integration tests** to ensure reliability and availability of the system.

### Test Structure

```text
Testing:
├── E2E Tests (Cypress)
│   ├── scheduler-workflows.spec.ts
│   ├── optimization-flow.spec.ts
│   └── constraint-validation.spec.ts
│
├── Integration Tests (NestJS)
│   ├── schedule.service.spec.ts
│   ├── constraint.service.spec.ts
│   └── optimization.integration.spec.ts
│
├── API Tests
│   ├── graphql-queries.test.ts
│   ├── rest-endpoints.test.ts
│   └── hasura-permissions.test.ts
│
└── Reliability & Availability Tests
    ├── load-tests/
    ├── stress-tests/
    ├── chaos-tests/
    └── health-check-tests/
```

### Testing Focus

- Critical user workflows (E2E)
- API contract validation
- Constraint validation logic
- Optimization service integration
- System reliability under load
- Service availability and recovery
- Data consistency and integrity

### Testing Setup for Reliability

#### 1. End-to-End Testing Setup

**Tools:**

- **Cypress**: Browser-based E2E testing
- **Test Data Management**: Seed scripts for consistent test environments
- **Test Isolation**: Independent test suites that don't interfere with each other

**Test Environment Configuration:**

- Separate test database instance
- Docker Compose test environment
- Automated test data cleanup between runs
- Mock external dependencies (if any)

**Coverage Areas:**

- Complete user workflows (schedule creation, optimization, conflict resolution)
- Cross-browser compatibility
- Responsive design validation
- Real-time subscription functionality
- Error handling and recovery flows

#### 2. Integration Testing Setup

**Tools:**

- **Jest / Vitest**: Test runner for backend services
- **Supertest**: HTTP assertion library for API testing
- **Test Containers**: Isolated database instances for testing

**Test Environment Configuration:**

- In-memory or test database instances
- Service mocking for external dependencies
- Automated service startup and teardown
- Test fixtures for consistent data

**Coverage Areas:**

- GraphQL resolver functionality
- REST API endpoints
- Database operations and transactions
- Service-to-service communication
- Constraint validation logic
- Optimization service integration

#### 3. Reliability Testing Setup

**Load Testing:**

- **Tool**: k6, Artillery, or JMeter
- **Scenarios**: Concurrent schedule operations, optimization requests, real-time subscriptions
- **Metrics**: Response times, throughput, error rates, resource utilization
- **Targets**: Define performance SLAs (e.g., 95th percentile response time < 500ms)

**Stress Testing:**

- **Purpose**: Identify system breaking points
- **Scenarios**: Maximum concurrent users, large dataset operations, optimization with complex constraints
- **Metrics**: System behavior under extreme load, recovery time

**Chaos Testing:**

- **Tool**: Chaos Monkey or custom scripts
- **Scenarios**: Service failures, database connection loss, network partitions
- **Purpose**: Verify system resilience and graceful degradation
- **Recovery Validation**: Ensure automatic recovery and data consistency

#### 4. Availability Testing Setup

**Health Check Endpoints:**

- **Backend**: `/health` endpoint with service status
- **Database**: Connection health checks
- **Optimization Service**: `/health` endpoint with solver availability
- **Hasura**: GraphQL health query

**Monitoring Integration:**

- Health check endpoints integrated with monitoring tools
- Automated alerting on service unavailability
- Uptime tracking and reporting

**Failover Testing:**

- Database failover scenarios
- Service restart procedures
- Data consistency after failures
- Graceful degradation when services are unavailable

#### 5. Data Integrity Testing Setup

**Database Testing:**

- Transaction rollback scenarios
- Constraint violation handling
- Data consistency across services
- Migration testing (forward and backward)

**Optimization Testing:**

- Solution correctness validation
- Constraint satisfaction verification
- Performance benchmarking for optimization algorithms
- Solution quality metrics

#### 6. Test Infrastructure

**Docker Compose Test Environment:**

```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: scheduler_test
    # Test-specific configuration
  
  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test
    depends_on:
      - postgres-test
      - backend
    # Test execution service
```

**CI/CD Integration:**

- Automated test execution on commits
- Test result reporting and tracking
- Performance regression detection
- Test coverage reporting

**Test Data Management:**

- Seed scripts for consistent test data
- Test fixtures for common scenarios
- Data anonymization for sensitive information
- Test data cleanup strategies

### Testing Execution Strategy

**Local Development:**

- Quick unit and integration tests during development
- E2E tests before committing major changes
- Manual smoke tests for critical paths

**Pre-Deployment:**

- Full test suite execution
- Load testing for performance validation
- Security and reliability checks

**Post-Deployment:**

- Smoke tests in production-like environment
- Health check monitoring
- Performance monitoring and alerting

### Test Metrics and Reporting

**Key Metrics:**

- Test coverage percentage
- Test execution time
- Flaky test identification
- Performance benchmarks
- Error rate tracking

**Reporting:**

- Test results dashboard
- Performance trend analysis
- Reliability metrics (MTBF, MTTR)
- Availability percentage tracking

## Performance Considerations

### Frontend Performance

- **Virtualization**: Bryntum Scheduler handles large datasets efficiently
- **GraphQL Codegen**: Type-safe, optimized queries
- **Query caching**: React Query / Apollo Client
- **Lazy loading**: Code splitting for feature modules
- **Responsive rendering**: Optimize for quick decision-making

### Backend Performance

- **Database indexing**: Optimize for time-range queries and employee lookups
- **Query optimization**: Efficient GraphQL resolvers
- **Caching**: Redis (optional) for frequently accessed constraint rules
- **Background processing**: Async optimization jobs for large schedules

### Data Scalability

- **Pagination**: For large employee lists and historical schedules
- **Time-based partitioning**: For historical schedule data
- **Materialized views**: For complex aggregations (coverage analysis)
- **Batch operations**: For bulk schedule updates

## Security Considerations

### On-Premise Deployment

- **Data isolation**: Each customer has separate database instance
- **Network security**: Intranet-only access
- **Authentication**: JWT tokens, role-based access control
- **Data encryption**: At rest and in transit
- **Audit logging**: Track all schedule changes and optimizations

## Development Workflow

### Local Development

1. **Docker Compose up**: All services run locally
2. **Nx commands**: `nx serve frontend`, `nx serve backend`
3. **Hot reload**: Development servers with watch mode
4. **Database migrations**: Hasura CLI for schema changes
5. **Type generation**: GraphQL Codegen watches for schema changes

### Code Generation

- **GraphQL Codegen**: Auto-generate TypeScript types from GraphQL schema
- **Hasura migrations**: Version-controlled database schema
- **Nx generators**: Scaffold new modules and components

## Monitoring & Observability

- **Grafana**: Monitoring dashboards
- **Logging**: Structured logging across services
- **Error tracking**: Centralized error monitoring
- **Performance metrics**: Query performance, optimization solve times

## Future Considerations

### Potential Enhancements

- **Hasura 3.x**: When stable and production-ready
- **React Testing Library**: For component testing
- **CI/CD Pipeline**: Automated testing and deployment
- **Development Containers**: Enhanced local setup
- **Advanced Monitoring**: Enhanced observability tools

### Explicitly Avoided

- **Kubernetes**: Docker Compose is sufficient for deployment needs
- **Microservices**: Monolithic NestJS app is simpler and more maintainable
- **Cloud-native patterns**: On-premise deployment doesn't require them
- **MongoDB**: PostgreSQL handles all data needs effectively

## Key Architectural Decisions

1. **Hasura for GraphQL**: Reduces boilerplate, auto-generates API
2. **Separate Python service**: OR-Tools is Python-native, keeps optimization isolated
3. **Nx monorepo**: Single repository, shared code, consistent tooling
4. **Docker Compose**: Simple deployment, no Kubernetes complexity
5. **JSONB for constraints**: Flexible schema for varying constraint types
6. **Bryntum Scheduler Pro**: Proven component for complex scheduling UI
7. **REST for optimization**: Simple integration between NestJS and Python service

## Conclusion

This architecture prioritizes:

- **Simplicity**: Straightforward, maintainable structure
- **Pragmatism**: Proven technologies, minimal complexity
- **Data scalability**: Optimized for complex datasets, not user scaling
- **Developer experience**: Easy local development, clear structure
- **Reliability and Availability**: Comprehensive testing strategies ensuring system stability and uptime

The architecture addresses the complex requirements of resource scheduling, optimization, and data visualization while maintaining high standards for reliability, availability, and maintainability.

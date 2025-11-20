# Resource Scheduler - Backend

NestJS backend application for the Resource Scheduler system, providing GraphQL and REST APIs for scheduling, constraint management, and optimization orchestration.

## Architecture

The backend follows a **modular architecture** pattern, organized by domain features. Each module encapsulates related business logic, GraphQL resolvers, and REST controllers.

### Architecture Principles

1. **Separation of Concerns**: Each module handles a specific domain (employees, schedules, constraints, optimization)
2. **GraphQL First**: Primary API interface using GraphQL with Hasura integration
3. **REST for Integration**: REST endpoints for service-to-service communication (optimization service)
4. **Service Layer**: Business logic separated from API layer
5. **Dependency Injection**: NestJS's built-in DI for testability and maintainability

### Module Structure

```
src/
├── modules/
│   ├── employees/          # Employee management
│   ├── schedules/          # Schedule management & conflict detection
│   ├── constraints/        # Constraint rules & validation
│   └── optimization/       # Optimization orchestration
├── common/                 # Shared utilities
│   ├── controllers/        # Common controllers (health checks)
│   ├── filters/            # Exception filters
│   └── interceptors/       # Request/response interceptors
└── config/                 # Configuration files
```

### Modules

#### 1. EmployeesModule
Manages employee data and operations.

**Components:**
- `EmployeesService` - Business logic for employee CRUD operations
- `EmployeesResolver` - GraphQL queries and mutations
- `EmployeesController` - REST endpoints for employee management

**Responsibilities:**
- Employee CRUD operations
- Skill management
- Availability tracking

#### 2. SchedulesModule
Handles schedule creation, updates, and conflict detection.

**Components:**
- `SchedulesService` - Business logic with conflict detection integration
- `ScheduleResolver` - GraphQL queries and mutations
- `ConflictDetectionService` - Detects scheduling conflicts (double-bookings, overlaps)
- `ValidationService` - Validates schedules against constraints

**Responsibilities:**
- Schedule CRUD operations
- Real-time conflict detection
- Constraint validation before schedule creation
- Schedule status management (confirmed, tentative, conflict)

#### 3. ConstraintsModule
Manages constraint rules and validation logic.

**Components:**
- `ConstraintsService` - Business logic for constraint management
- `ConstraintsResolver` - GraphQL queries and mutations
- `RuleEngineService` - Evaluates constraint rules against schedules

**Responsibilities:**
- Constraint CRUD operations
- Rule structure validation
- Constraint evaluation (max hours, min rest, fair distribution)
- Active constraint management

#### 4. OptimizationModule
Orchestrates schedule optimization requests to the Python service.

**Components:**
- `OptimizationService` - Business logic for optimization
- `OptimizationResolver` - GraphQL mutations for optimization requests
- `OptimizationOrchestrator` - Coordinates optimization flow
- `OptimizationClient` - REST client to Python optimization service

**Responsibilities:**
- Collecting current state (employees, shifts, constraints)
- Calling Python optimization service
- Validating optimization solutions
- Returning solution candidates to frontend

## Technology Stack & Dependency Choices

### Core Framework

**NestJS** (`^10.0.0`)
- **Why**: Enterprise-grade Node.js framework with built-in TypeScript support
- **Benefits**: Modular architecture, dependency injection, decorator-based APIs
- **Alternatives Considered**: Express.js (too low-level), Fastify (less ecosystem)

### GraphQL

**@nestjs/graphql** (`^12.0.0`) + **@nestjs/apollo** (`^12.0.0`) + **@apollo/server** (`^5.0.0`)
- **Why**: Type-safe GraphQL API with code-first schema generation
- **Benefits**: 
  - Auto-generated schema from TypeScript decorators
  - Integration with Hasura for database operations
  - Apollo Server v5 for modern GraphQL features
- **Note**: Apollo Server v5 replaces GraphQL Playground with Apollo Studio Explorer

**graphql** (`^16.8.0`)
- **Why**: Core GraphQL library required by NestJS GraphQL
- **Version Choice**: v16 for stability and compatibility

### Validation

**class-validator** (`^0.14.0`) + **class-transformer** (`^0.5.1`)
- **Why**: Decorator-based validation for DTOs
- **Benefits**: Type-safe validation, automatic transformation
- **Usage**: Validates request payloads before processing

### HTTP Client

**axios** (`^1.6.0`)
- **Why**: HTTP client for calling Python optimization service
- **Benefits**: Promise-based, interceptors, request/response transformation
- **Alternatives Considered**: `fetch` (less features), `node-fetch` (additional dependency)

### Testing

**Jest** (`^29.0.0`) + **supertest** (`^7.1.3`)
- **Why**: Industry-standard testing framework
- **Benefits**: Built-in mocking, coverage reports, E2E testing support
- **Version**: v7.1.3+ to avoid deprecation warnings

### Development Tools

**TypeScript** (`^5.0.0`)
- **Why**: Type safety and modern JavaScript features
- **Benefits**: Catch errors at compile-time, better IDE support

**ESLint** (`^9.0.0`) + **@typescript-eslint** (`^8.0.0`)
- **Why**: Code quality and consistency
- **Version**: v9 for latest features, v8 TypeScript ESLint for compatibility

## Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- PostgreSQL (for Hasura)
- Python optimization service (for optimization features)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the backend root:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration (for direct access if needed)
DB_HOST=localhost
DB_PORT=5432
DB_USER=scheduler
DB_PASSWORD=scheduler
DB_NAME=scheduler

# Hasura Configuration
HASURA_URL=http://localhost:8080
HASURA_ADMIN_SECRET=your-admin-secret
HASURA_GRAPHQL_ENDPOINT=/v1/graphql

# Optimization Service
OPTIMIZER_SERVICE_URL=http://localhost:8000
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

### Development Workflow

1. **Start dependencies**: Ensure PostgreSQL and Hasura are running
2. **Start backend**: `npm run start:dev`
3. **Access GraphQL**: `http://localhost:3000/graphql`
4. **Health check**: `http://localhost:3000/health`

## API Endpoints

### REST API

#### Health Check
- `GET /health` - Service health status

#### Employees
- `GET /employees` - List all employees
- `POST /employees` - Create new employee
- `GET /employees/:id` - Get employee by ID
- `PATCH /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee

### GraphQL API

**Endpoint**: `http://localhost:3000/graphql`

**Available in Development**: Apollo Studio Explorer (replaces GraphQL Playground)

**Example Queries:**

```graphql
# Get all employees
query {
  employees {
    id
    name
    skills
  }
}

# Get schedules with conflicts
query {
  schedules {
    id
    employee {
      name
    }
    startTime
    endTime
    status
  }
}

# Trigger optimization
mutation {
  optimizeSchedule(optimizationRequest: {
    startDate: "2024-01-01"
    endDate: "2024-01-31"
  }) {
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

## Configuration

### GraphQL Configuration

Located in `src/app.module.ts`:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
  introspection: process.env.NODE_ENV !== 'production',
  // Apollo Server v5 uses Apollo Studio Explorer by default
})
```

### Database Configuration

Located in `src/config/database.config.ts`:
- Used for direct database access if needed
- Primary data access should go through Hasura GraphQL

### Hasura Configuration

Located in `src/config/hasura.config.ts`:
- Configures connection to Hasura GraphQL engine
- Used for custom GraphQL operations beyond Hasura's auto-generated API

## Testing

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

### Test Structure

```
test/
├── app.e2e-spec.ts      # E2E test example
└── jest-e2e.json        # E2E test configuration
```

### Testing Strategy

Following the project's philosophy:
- **E2E Tests**: Critical user workflows
- **Integration Tests**: API contract validation
- **Service Tests**: Business logic validation
- **NOT**: Excessive unit tests for simple functions

## Known Issues & Warnings

### Deprecated Package Warning

**Warning**: `@apollo/server-plugin-landing-page-graphql-playground@4.0.0` is deprecated

**Status**: Safe to ignore

**Reason**:
1. We're using **Apollo Server v5** which doesn't use this package
2. The playground option has been removed from configuration
3. Apollo Server v5 uses **Apollo Studio Explorer** by default
4. The warning comes from a transitive dependency and doesn't affect functionality

**Resolution**: This will be resolved when `@nestjs/apollo` updates its dependencies.

## Project Structure

```
apps/backend/
├── src/
│   ├── modules/
│   │   ├── employees/
│   │   │   ├── employees.module.ts
│   │   │   ├── employees.service.ts
│   │   │   ├── employees.resolver.ts
│   │   │   └── employees.controller.ts
│   │   ├── schedules/
│   │   │   ├── schedules.module.ts
│   │   │   ├── schedules.service.ts
│   │   │   ├── schedules.resolver.ts
│   │   │   ├── conflict-detection.service.ts
│   │   │   └── validation.service.ts
│   │   ├── constraints/
│   │   │   ├── constraints.module.ts
│   │   │   ├── constraints.service.ts
│   │   │   ├── constraints.resolver.ts
│   │   │   └── rule-engine.service.ts
│   │   └── optimization/
│   │       ├── optimization.module.ts
│   │       ├── optimization.service.ts
│   │       ├── optimization.resolver.ts
│   │       ├── optimization-orchestrator.service.ts
│   │       └── optimization-client.service.ts
│   ├── common/
│   │   ├── controllers/
│   │   │   └── health.controller.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── interceptors/
│   │       └── logging.interceptor.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   └── hasura.config.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .eslintrc.js
├── .gitignore
└── README.md
```

## Integration Points

### Hasura Integration

- **Primary Data Access**: Most CRUD operations go through Hasura's auto-generated GraphQL API
- **Custom Logic**: NestJS resolvers handle business logic beyond Hasura's capabilities
- **Real-time**: Hasura subscriptions for live updates

### Python Optimization Service

- **Communication**: REST API via `OptimizationClient`
- **Protocol**: HTTP/JSON
- **Error Handling**: Graceful degradation if service unavailable

### Frontend Integration

- **GraphQL**: Primary API interface
- **REST**: Fallback for specific endpoints
- **CORS**: Configured for frontend origin

## Development Guidelines

### Code Style

- Follow NestJS conventions
- Use TypeScript strict mode where possible
- Prefer decorators for metadata
- Use dependency injection for services

### Adding New Features

1. Create module in `src/modules/`
2. Add service for business logic
3. Add resolver for GraphQL operations
4. Add controller for REST endpoints (if needed)
5. Register module in `app.module.ts`

### Best Practices

- Keep services focused on single responsibility
- Use DTOs for data validation
- Handle errors gracefully with exception filters
- Log important operations
- Write integration tests for critical paths

## Troubleshooting

### Common Issues

**GraphQL schema not generating**
- Check `autoSchemaFile` path in `app.module.ts`
- Ensure all resolvers are properly registered

**Optimization service connection failed**
- Verify `OPTIMIZER_SERVICE_URL` in `.env`
- Check Python service is running
- Review `OptimizationClient` timeout settings

**Hasura connection issues**
- Verify Hasura is running on configured port
- Check `HASURA_URL` and `HASURA_ADMIN_SECRET`
- Ensure PostgreSQL is accessible to Hasura

## License

Part of the Resource Scheduler project.


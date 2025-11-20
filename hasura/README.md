# Hasura Configuration - Complete Guide

## Overview

The `hasura/` folder contains all configuration, metadata, and database migrations for Hasura GraphQL Engine. Hasura acts as an **API Gateway Layer** that automatically generates a GraphQL API from PostgreSQL database schema.

## Folder Structure

```
hasura/
├── config.yaml              # Hasura CLI configuration
├── metadata/                # Hasura metadata (configuration as code)
│   ├── databases/           # Database connection configuration
│   ├── actions.yaml         # Custom GraphQL actions
│   ├── allow_list.yaml      # Query allow list (security)
│   ├── cron_triggers.yaml   # Scheduled tasks
│   ├── query_collections.yaml # Saved query collections
│   ├── remote_schemas.yaml  # Remote GraphQL schema stitching
│   └── version.yaml         # Metadata version
└── migrations/              # Database schema migrations
    └── 1734700000000_init/  # Initial migration
        ├── up.sql          # Migration to apply
        └── down.sql        # Migration to rollback
```

---

## Core Components Explained

### 1. `config.yaml` - Hasura CLI Configuration

**Purpose:** Configuration file for Hasura CLI commands.

**Key Settings:**
- `endpoint`: Hasura GraphQL Engine URL
- `admin_secret`: Authentication secret for admin operations
- `metadata_directory`: Where Hasura metadata is stored
- `migrations_directory`: Where database migrations are stored

**Usage:**
```bash
hasura migrate apply    # Applies migrations
hasura metadata apply   # Applies metadata configuration
hasura console          # Opens Hasura console
```

### 2. `metadata/` - Configuration as Code

**Purpose:** Stores all Hasura configuration in version-controlled YAML files.

**Benefits:**
- ✅ Version control for all Hasura settings
- ✅ Reproducible deployments
- ✅ Team collaboration
- ✅ Easy rollback

#### `metadata/databases/databases.yaml`
Defines database connections and settings:
- Connection pool configuration
- Prepared statements usage
- Transaction isolation level

#### `metadata/actions.yaml`
Custom GraphQL actions that call external services (e.g., your NestJS backend).

#### `metadata/allow_list.yaml`
Security feature: Only allows pre-approved queries to execute.

#### `metadata/cron_triggers.yaml`
Scheduled tasks that run SQL or call webhooks at specified intervals.

#### `metadata/query_collections.yaml`
Saved query collections for common operations.

#### `metadata/remote_schemas.yaml`
Stitches external GraphQL APIs into Hasura's schema.

### 3. `migrations/` - Database Schema Version Control

**Purpose:** SQL migrations that define and modify your database schema.

**Structure:**
- Each migration is a timestamped folder
- `up.sql`: Changes to apply
- `down.sql`: Changes to rollback

**Example Migration:**
```sql
-- up.sql: Creates tables, indexes, triggers
CREATE TABLE employees (...);

-- down.sql: Removes what up.sql created
DROP TABLE employees;
```

**Benefits:**
- ✅ Schema versioning
- ✅ Reproducible database state
- ✅ Team synchronization
- ✅ Safe rollbacks

---

## Core Principles

### 1. **Schema-First Approach**
Hasura automatically generates a GraphQL API from your PostgreSQL schema. When you create a table, Hasura immediately exposes:
- Queries (read operations)
- Mutations (write operations)
- Subscriptions (real-time updates)

### 2. **Configuration as Code**
All Hasura settings are stored in YAML files, making them:
- Version controllable
- Reproducible
- Reviewable in pull requests

### 3. **Zero Boilerplate**
No need to write:
- GraphQL resolvers
- API endpoints
- Database query logic
- CRUD operations

### 4. **Real-time by Default**
Subscriptions are automatically available for all tables, enabling real-time updates without additional code.

### 5. **Permission-Based Security**
Row-level and column-level permissions are defined declaratively in metadata.

---

## How Hasura Communicates

### 🔄 Communication Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │────────▶│    Hasura    │────────▶│ PostgreSQL  │
│ (Frontend)  │ GraphQL │ GraphQL Engine│  SQL   │  Database   │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              │ HTTP/REST
                              ▼
                        ┌─────────────┐
                        │   Backend   │
                        │  (NestJS)   │
                        └─────────────┘
```

### 1. **Hasura ↔ PostgreSQL Communication**

**Connection:**
- Hasura connects to PostgreSQL using connection string from `HASURA_GRAPHQL_DATABASE_URL`
- Uses connection pooling for performance
- Supports prepared statements

**How it works:**
1. **Schema Introspection:** Hasura reads PostgreSQL schema (tables, columns, relationships)
2. **Query Translation:** GraphQL queries are translated to optimized SQL
3. **Execution:** SQL is executed against PostgreSQL
4. **Response:** Results are formatted as GraphQL JSON

**Example:**
```graphql
# GraphQL Query
query {
  employees {
    id
    name
    schedules {
      startTime
    }
  }
}
```

**Translates to SQL:**
```sql
SELECT 
  employees.id,
  employees.name,
  json_agg(schedules.*) as schedules
FROM employees
LEFT JOIN schedules ON schedules.employee_id = employees.id
GROUP BY employees.id, employees.name;
```

**Benefits:**
- ✅ Optimized SQL generation
- ✅ Automatic JOIN handling
- ✅ Efficient query batching
- ✅ Connection pooling

### 2. **Hasura ↔ Backend (NestJS) Communication**

**Two Integration Patterns:**

#### Pattern A: Hasura as Primary API (Current Setup)
```
Frontend → Hasura GraphQL → PostgreSQL
              ↓
         (for complex logic)
              ↓
         NestJS Backend
```

**Use Cases:**
- Complex business logic
- Optimization service calls
- Custom validations
- External API integrations

**How it works:**
1. Frontend queries Hasura for most operations
2. Hasura handles CRUD automatically
3. For complex operations, Hasura can call NestJS via:
   - **Actions:** Custom GraphQL mutations/queries
   - **Webhooks:** Event triggers
   - **Remote Schemas:** Stitch NestJS GraphQL schema

#### Pattern B: NestJS as GraphQL Gateway
```
Frontend → NestJS GraphQL → Hasura → PostgreSQL
```

**Current Implementation:**
- NestJS has its own GraphQL server
- Uses HasuraClientService to query Hasura
- Combines Hasura data with business logic

**Example from Backend:**
```typescript
// apps/backend/src/common/services/hasura-client.service.ts
async execute<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const response = await this.client.post('', {
    query,  // GraphQL query
    variables,
  });
  return response.data.data;
}
```

**Benefits:**
- ✅ Best of both worlds
- ✅ Hasura for simple CRUD
- ✅ NestJS for complex logic
- ✅ Unified GraphQL API

---

## Benefits of This Architecture

### 1. **Developer Productivity**
- **80% less code:** No need to write CRUD endpoints
- **Instant API:** GraphQL API available immediately after table creation
- **Type-safe:** Auto-generated TypeScript types

### 2. **Performance**
- **Optimized queries:** Hasura generates efficient SQL
- **Connection pooling:** Reuses database connections
- **Query batching:** Combines multiple queries into one request

### 3. **Real-time Capabilities**
- **Subscriptions:** Real-time updates without WebSocket management
- **Event triggers:** React to database changes
- **Live queries:** Automatic cache invalidation

### 4. **Security**
- **Row-level security:** Filter data based on user roles
- **Column-level security:** Hide sensitive fields
- **Permission system:** Declarative access control

### 5. **Scalability**
- **Horizontal scaling:** Multiple Hasura instances
- **Database optimization:** Efficient query patterns
- **Caching:** Built-in query result caching

---

## Workflow: How Changes Flow

### Adding a New Feature

1. **Create Migration:**
   ```bash
   hasura migrate create add_new_table --database-name default
   ```
   - Creates `up.sql` and `down.sql` files

2. **Write SQL:**
   ```sql
   -- up.sql
   CREATE TABLE new_table (...);
   ```

3. **Apply Migration:**
   ```bash
   hasura migrate apply
   ```
   - Executes SQL in PostgreSQL

4. **Track Table in Hasura:**
   - Via Console: Data tab → Track table
   - Or via CLI: `hasura metadata reload`

5. **GraphQL API Available:**
   - Queries, mutations, subscriptions automatically generated

6. **Export Metadata:**
   ```bash
   hasura metadata export
   ```
   - Saves configuration to `metadata/` folder

7. **Commit Changes:**
   - Commit migration files
   - Commit metadata changes
   - Team can now apply same changes

---

## Example: Complete Request Flow

### Scenario: Frontend fetches employee schedules

1. **Frontend sends GraphQL query:**
   ```graphql
   query GetEmployeeSchedules($employeeId: uuid!) {
     employees_by_pk(id: $employeeId) {
       name
       schedules {
         startTime
         endTime
         shift {
           department {
             name
           }
         }
       }
     }
   }
   ```

2. **Hasura receives query:**
   - Validates query syntax
   - Checks permissions
   - Generates optimized SQL

3. **SQL executed on PostgreSQL:**
   ```sql
   SELECT 
     e.name,
     json_agg(
       json_build_object(
         'startTime', s.start_time,
         'endTime', s.end_time,
         'shift', json_build_object(
           'department', json_build_object('name', d.name)
         )
       )
     ) as schedules
   FROM employees e
   JOIN schedules s ON s.employee_id = e.id
   JOIN shifts sh ON sh.id = s.shift_id
   JOIN departments d ON d.id = sh.department_id
   WHERE e.id = $1
   GROUP BY e.id, e.name;
   ```

4. **PostgreSQL returns data:**
   - Raw database rows

5. **Hasura formats response:**
   - Converts SQL results to GraphQL JSON
   - Applies field-level permissions
   - Returns to frontend

6. **Frontend receives:**
   ```json
   {
     "data": {
       "employees_by_pk": {
         "name": "John Doe",
         "schedules": [
           {
             "startTime": "2024-01-01T09:00:00Z",
             "endTime": "2024-01-01T17:00:00Z",
             "shift": {
               "department": {
                 "name": "Engineering"
               }
             }
           }
         ]
       }
     }
   }
   ```

---

## Best Practices

### 1. **Always Version Control**
- Commit all migrations
- Commit all metadata changes
- Never edit database directly in production

### 2. **Migration Naming**
- Use descriptive names: `add_employee_skills_index`
- Include timestamp: `1734700000000_add_employee_skills_index`

### 3. **Metadata Management**
- Export metadata after console changes
- Review metadata changes in PRs
- Test migrations locally first

### 4. **Security**
- Use strong admin secrets
- Configure row-level security
- Limit exposed columns
- Use allow lists in production

### 5. **Performance**
- Add indexes for frequently queried columns
- Use connection pooling
- Monitor query performance
- Use query collections for common operations

---

## Troubleshooting

### Migration Issues
```bash
# Check migration status
hasura migrate status

# Apply pending migrations
hasura migrate apply

# Rollback last migration
hasura migrate apply --down 1
```

### Metadata Issues
```bash
# Reload metadata from database
hasura metadata reload

# Export current metadata
hasura metadata export

# Clear and reload
hasura metadata clear
hasura metadata apply
```

### Connection Issues
- Verify `HASURA_GRAPHQL_DATABASE_URL` in environment
- Check PostgreSQL is running and accessible
- Verify network connectivity between Hasura and PostgreSQL

---

## Summary

The `hasura/` folder is the **single source of truth** for:
- Database schema (migrations)
- Hasura configuration (metadata)
- API structure (auto-generated from schema)

**Key Takeaway:** Hasura eliminates the need to write boilerplate API code by automatically generating a production-ready GraphQL API from your database schema, while maintaining full control through version-controlled migrations and metadata.


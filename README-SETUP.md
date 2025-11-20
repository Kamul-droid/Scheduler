# Resource Scheduler - Setup Guide

This guide will help you set up the Resource Scheduler application with PostgreSQL and Hasura.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for backend)
- npm or yarn

## Quick Start

### 1. Environment Setup

Copy the environment example file:

```bash
cp .env.example .env
```

Edit `.env` and update any values if needed (defaults should work for local development).

### 2. Start PostgreSQL and Hasura

From the project root, start the database and Hasura services:

```bash
cd infrastructure
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Hasura GraphQL Engine on port 8080

### 3. Apply Database Migrations

The initial migration will be applied automatically when Hasura starts. To manually apply migrations:

```bash
cd hasura
hasura migrate apply --database-name default
```

### 4. Track Tables in Hasura

After the database is set up, you need to track the tables in Hasura:

1. Open Hasura Console: http://localhost:8080/console
2. Go to the "Data" tab
3. Click "Track All" to track all tables
4. Set up relationships and permissions as needed

Or use the Hasura CLI:

```bash
cd hasura
hasura metadata apply
```

### 5. Start Backend

```bash
cd apps/backend
npm install
npm run start:dev
```

The backend will be available at http://localhost:3000

## Database Schema

The initial migration creates the following tables:

- **employees** - Employee information with skills and availability
- **departments** - Department definitions
- **shifts** - Shift definitions with staffing requirements
- **schedules** - Schedule assignments linking employees to shifts
- **constraints** - Constraint rules for scheduling

All tables use UUID primary keys and include `created_at` and `updated_at` timestamps.

## Hasura Configuration

### Access Hasura Console

- URL: http://localhost:8080/console
- Admin Secret: `myadminsecretkey` (default, change in production!)

### GraphQL Endpoint

- URL: http://localhost:8080/v1/graphql
- Admin Secret Header: `x-hasura-admin-secret: myadminsecretkey`

## Development Workflow

### Database Migrations

Create a new migration:

```bash
cd hasura
hasura migrate create <migration_name> --database-name default
```

Apply migrations:

```bash
hasura migrate apply --database-name default
```

### Hasura Metadata

Export metadata:

```bash
hasura metadata export
```

Apply metadata:

```bash
hasura metadata apply
```

## Troubleshooting

### PostgreSQL not starting

Check if port 5432 is already in use:

```bash
# Windows
netstat -ano | findstr :5432

# Linux/Mac
lsof -i :5432
```

### Hasura can't connect to PostgreSQL

1. Ensure PostgreSQL is healthy: `docker ps`
2. Check PostgreSQL logs: `docker logs resource-scheduler-postgres`
3. Verify environment variables in `docker-compose.yml`

### Reset Database

To completely reset the database:

```bash
cd infrastructure
docker-compose down -v  # Removes volumes
docker-compose up -d
```

## Production Considerations

For production deployment:

1. **Change default passwords** in `.env` and `docker-compose.yml`
2. **Use strong Hasura admin secret**
3. **Enable SSL** for PostgreSQL connections
4. **Set up proper backups**
5. **Configure Hasura permissions** properly
6. **Use environment-specific docker-compose.prod.yml**

## Next Steps

- Set up authentication/authorization in Hasura
- Configure table permissions
- Set up relationships between tables
- Create GraphQL queries and mutations
- Test the backend API endpoints


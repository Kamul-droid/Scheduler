# Quick Start Guide

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed
- npm or yarn

## Setup Steps

### 1. Environment Configuration

Create a `.env` file in the project root:

```bash
# Copy from example (if available) or create manually
cp .env.example .env
```

Minimum required variables:
```env
DB_USER=scheduler
DB_PASSWORD=scheduler
DB_NAME=scheduler
HASURA_ADMIN_SECRET=myadminsecretkey
```

### 2. Start Database and Hasura

**Windows (PowerShell):**
```powershell
cd infrastructure
.\setup.ps1
```

**Linux/Mac:**
```bash
cd infrastructure
chmod +x setup.sh
./setup.sh
```

**Manual:**
```bash
cd infrastructure
docker-compose up -d
```

### 3. Verify Services

Check that services are running:
```bash
docker-compose ps
```

You should see:
- `resource-scheduler-postgres` - healthy
- `resource-scheduler-hasura` - healthy

### 4. Access Hasura Console

Open in browser: http://localhost:8080/console

Login with admin secret: `myadminsecretkey`

### 5. Track Tables

In Hasura Console:
1. Go to "Data" tab
2. Click "Track All" button
3. Verify all tables are tracked:
   - employees
   - departments
   - shifts
   - schedules
   - constraints

### 6. Start Backend

```bash
cd apps/backend
npm install
npm run start:dev
```

Backend will be available at: http://localhost:3000

### 7. Test Setup

**Health Check:**
```bash
curl http://localhost:3000/health
```

**GraphQL Endpoint:**
```bash
curl http://localhost:3000/graphql
```

**Hasura GraphQL:**
```bash
curl -X POST http://localhost:8080/v1/graphql \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: myadminsecretkey" \
  -d '{"query": "{ __typename }"}'
```

## Common Commands

### Stop Services
```bash
cd infrastructure
docker-compose down
```

### View Logs
```bash
docker-compose logs -f postgres
docker-compose logs -f hasura
```

### Reset Database
```bash
docker-compose down -v
docker-compose up -d
```

### Access PostgreSQL
```bash
docker exec -it resource-scheduler-postgres psql -U scheduler -d scheduler
```

## Troubleshooting

**Port already in use:**
- Change ports in `docker-compose.yml` and `.env`

**Services won't start:**
- Check Docker is running
- Check logs: `docker-compose logs`

**Hasura can't connect:**
- Wait a few seconds for PostgreSQL to be ready
- Check PostgreSQL logs
- Verify environment variables

## Next Steps

1. Set up table relationships in Hasura
2. Configure permissions
3. Test GraphQL queries
4. Start frontend development


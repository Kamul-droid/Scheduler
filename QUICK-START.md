# Quick Start Guide

Get the Resource Scheduler application up and running in minutes using Docker Compose.

## Prerequisites

- **Docker Desktop** installed and running (or Docker Engine on Linux)
- **Docker Compose** v2.0+ (included with Docker Desktop)
- **Git** for cloning the repository
- **Node.js 20+** (optional, for local development without Docker)

## Quick Start (Docker Compose)

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd portfolio
```

### 2. Environment Configuration

Create an `.env` file in the `infrastructure` directory (optional - defaults are provided):

```bash
cd infrastructure
cp env.template .env
```

Edit `.env` if needed (defaults work for local development):

```env
# Database Configuration
DB_USER=scheduler
DB_PASSWORD=scheduler
DB_NAME=scheduler
DB_PORT=5432

# Hasura Configuration
HASURA_PORT=8080
HASURA_ADMIN_SECRET=myadminsecretkey

# Backend Service
BACKEND_PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000,http://localhost:3001,http://localhost:5173

# Optimization Service
OPTIMIZER_PORT=8000

# Frontend Service
FRONTEND_PORT=3001
```

### 3. Start All Services

**Windows (PowerShell):**
```powershell
cd infrastructure
docker-compose up --build
```

**Linux/Mac:**
```bash
cd infrastructure
docker-compose up --build
```

**Background Mode:**
```bash
docker-compose up --build -d
```

This will start all 5 services:
- **PostgreSQL** (port 5432)
- **Hasura** (port 8080)
- **Backend** (port 3000)
- **Optimizer** (port 8000)
- **Frontend** (port 3001)

### 4. Wait for Services to Start

The first startup may take 2-3 minutes as Docker builds images and services initialize. Watch the logs to see progress:

```bash
docker-compose logs -f
```

**Service Startup Order:**
1. PostgreSQL starts and becomes healthy
2. Hasura waits for PostgreSQL, then starts
3. Backend and Optimizer start in parallel
4. Frontend waits for Backend, then:
   - Waits for backend to be ready (up to 120 seconds)
   - Starts seed script in background
   - Starts Vite dev server

### 5. Verify Services

Check service status:
```bash
docker-compose ps
```

All services should show as "healthy" or "running". You should see:
- `resource-scheduler-postgres` - healthy
- `resource-scheduler-hasura` - healthy
- `resource-scheduler-backend` - healthy
- `resource-scheduler-optimizer` - healthy
- `resource-scheduler-frontend` - healthy

### 6. Access the Application

**Frontend Application:**
- URL: http://localhost:3001
- The seed script runs automatically on startup, so test data should be available

**Hasura Console:**
- URL: http://localhost:8080/console
- Admin Secret: `myadminsecretkey` (or your custom secret from `.env`)

**Backend API:**
- REST API: http://localhost:3000
- GraphQL: http://localhost:3000/graphql
- Health Check: http://localhost:3000/health

**Optimizer Service:**
- Health Check: http://localhost:8000/health

### 7. Test the Setup

**Backend Health Check:**
```bash
curl http://localhost:3000/health
```

**Optimizer Health Check:**
```bash
curl http://localhost:8000/health
```

**Frontend:**
Open http://localhost:3001 in your browser. You should see the Resource Scheduler application with test data already seeded.

**Check Seed Script Logs:**
```bash
docker exec resource-scheduler-frontend cat /tmp/seed.log
```

## Service Details

### Frontend Service

- **Port**: 3001
- **Technology**: React + Vite + TypeScript
- **Features**:
  - Automatic test data seeding on startup
  - Hot reload enabled (source code mounted as volumes)
  - Vite proxy for API calls (no CORS issues)
- **Seed Script**: Runs in background, logs available at `/tmp/seed.log` in container

### Backend Service

- **Port**: 3000
- **Technology**: NestJS + TypeScript
- **Endpoints**:
  - REST API: `/employees`, `/schedules`, `/constraints`, `/shifts`, `/departments`, `/optimization`
  - GraphQL: `/graphql`
  - Health: `/health` and `/health/live`

### Hasura Service

- **Port**: 8080
- **Version**: 2.36.0
- **Console**: http://localhost:8080/console
- **GraphQL Endpoint**: http://localhost:8080/v1/graphql

### Optimizer Service

- **Port**: 8000
- **Technology**: Python + FastAPI + OR-Tools CP-SAT
- **Endpoints**:
  - `POST /optimize` - Start optimization
  - `GET /optimize/:id` - Get optimization status
  - `GET /health` - Health check

### PostgreSQL Database

- **Port**: 5432
- **Version**: 15-alpine
- **Database**: `scheduler`
- **User**: `scheduler`
- **Password**: `scheduler` (or from `.env`)

## Common Commands

### View Logs

**All services:**
```bash
docker-compose logs -f
```

**Specific service:**
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f hasura
docker-compose logs -f optimizer
docker-compose logs -f postgres
```

**Frontend seed script logs:**
```bash
docker exec resource-scheduler-frontend cat /tmp/seed.log
```

### Stop Services

```bash
cd infrastructure
docker-compose down
```

### Stop and Remove Volumes (Reset Database)

```bash
docker-compose down -v
```

**Warning**: This will delete all data in the database!

### Restart a Specific Service

```bash
docker-compose restart frontend
docker-compose restart backend
```

### Rebuild After Code Changes

```bash
docker-compose up --build frontend
docker-compose up --build backend
```

### Access Container Shells

**Frontend:**
```bash
docker exec -it resource-scheduler-frontend sh
```

**Backend:**
```bash
docker exec -it resource-scheduler-backend sh
```

**PostgreSQL:**
```bash
docker exec -it resource-scheduler-postgres psql -U scheduler -d scheduler
```

### Check Service Health

```bash
# Backend
curl http://localhost:3000/health

# Optimizer
curl http://localhost:8000/health

# Frontend
curl http://localhost:3001

# Hasura
curl http://localhost:8080/v1/version
```

## Development Workflow

### Local Development (Without Docker)

If you prefer to run services locally:

**1. Start Database and Hasura:**
```bash
cd infrastructure
docker-compose up -d postgres hasura
```

**2. Start Backend:**
```bash
cd apps/backend
npm install
npm run start:dev
```

**3. Start Optimizer:**
```bash
cd apps/optimizer
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 8000
```

**4. Start Frontend:**
```bash
cd apps/frontend
npm install
npm run dev
```

**5. Seed Test Data:**
```bash
cd apps/frontend
npm run seed
```

### Running Tests

**Frontend E2E Tests (Cypress):**
```bash
cd apps/frontend
npm run test:e2e
```

**Frontend Unit Tests:**
```bash
cd apps/frontend
npm run test
```

**Backend Tests:**
```bash
cd apps/backend
npm run test
```

## Troubleshooting

### Port Already in Use

If a port is already in use, either:
1. Stop the conflicting service
2. Change the port in `docker-compose.yml` and `.env`

**Example - Change frontend port to 3002:**
```yaml
# docker-compose.yml
ports:
  - "3002:3001"  # host:container
```

```env
# .env
FRONTEND_PORT=3002
```

### Services Won't Start

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Check logs:**
   ```bash
   docker-compose logs
   ```

3. **Check disk space:**
   ```bash
   docker system df
   ```

4. **Clean up unused resources:**
   ```bash
   docker system prune -a
   ```

### Frontend Seed Script Not Running

1. **Check if backend is ready:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check seed script logs:**
   ```bash
   docker exec resource-scheduler-frontend cat /tmp/seed.log
   ```

3. **Manually run seed script:**
   ```bash
   docker exec resource-scheduler-frontend npm run seed
   ```

### Hasura Can't Connect to Database

1. **Wait for PostgreSQL to be ready** (health check takes ~10 seconds)
2. **Check PostgreSQL logs:**
   ```bash
   docker-compose logs postgres
   ```
3. **Verify environment variables:**
   ```bash
   docker-compose config
   ```
4. **Restart Hasura:**
   ```bash
   docker-compose restart hasura
   ```

### Build Errors

**ESLint peer dependency conflicts:**
- The frontend Dockerfile uses `--legacy-peer-deps` to resolve this
- If building manually, use: `npm ci --legacy-peer-deps`

**Out of memory errors:**
- Increase Docker Desktop memory allocation (Settings → Resources)
- Recommended: 4GB+ RAM for Docker

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```bash
   docker-compose ps postgres
   ```

2. **Test connection:**
   ```bash
   docker exec -it resource-scheduler-postgres psql -U scheduler -d scheduler -c "SELECT 1;"
   ```

3. **Check network:**
   ```bash
   docker network inspect infrastructure_scheduler-network
   ```

## Next Steps

1. **Explore the Application:**
   - Open http://localhost:3001
   - Navigate through employees, schedules, and constraints
   - Try the optimization feature

2. **Access Hasura Console:**
   - Open http://localhost:8080/console
   - Explore the GraphQL API
   - Test queries and mutations

3. **Review API Documentation:**
   - Backend REST API: http://localhost:3000
   - GraphQL Schema: Available in Hasura Console

4. **Run Tests:**
   - Frontend E2E: `cd apps/frontend && npm run test:e2e`
   - Backend: `cd apps/backend && npm run test`

5. **Read Documentation:**
   - Architecture: `README.md`
   - Frontend API: `apps/frontend/API_ENDPOINTS.md`
   - Testing: `TESTING.md`

## Environment Variables Reference

### Required (with defaults)

All services have sensible defaults, but you can override them in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USER` | `scheduler` | PostgreSQL username |
| `DB_PASSWORD` | `scheduler` | PostgreSQL password |
| `DB_NAME` | `scheduler` | Database name |
| `DB_PORT` | `5432` | PostgreSQL port |
| `HASURA_PORT` | `8080` | Hasura GraphQL port |
| `HASURA_ADMIN_SECRET` | `myadminsecretkey` | Hasura admin secret |
| `BACKEND_PORT` | `3000` | Backend API port |
| `OPTIMIZER_PORT` | `8000` | Optimizer service port |
| `FRONTEND_PORT` | `3001` | Frontend dev server port |
| `NODE_ENV` | `production` | Node environment |

### Frontend Environment Variables

Set in `docker-compose.yml` or frontend `.env`:

| Variable | Description |
|----------|-------------|
| `VITE_BACKEND_URL` | Backend service URL (for Vite proxy) |
| `VITE_HASURA_URL` | Hasura service URL |
| `VITE_HASURA_ADMIN_SECRET` | Hasura admin secret |
| `SEED_BACKEND_STANDALONE` | Set to `true` for seed script to exit after completion |

## Production Deployment

For production deployment:

1. **Update environment variables** with secure values
2. **Use production Docker images** (build with `--production` flag)
3. **Configure reverse proxy** (nginx/traefik) for frontend
4. **Set up SSL/TLS certificates**
5. **Configure database backups**
6. **Set up monitoring and logging**

See `infrastructure/docker-compose.prod.yml` for production template.

## Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Review the architecture documentation: `README.md`
3. Check service health endpoints
4. Review troubleshooting section above

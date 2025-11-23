# Hasura Metadata Setup Guide

## Problem

If you see errors like:
```
Error: Hasura query failed: field 'employees' not found in type: 'query_root'
```

This means Hasura hasn't tracked the database tables yet. The tables exist in PostgreSQL, but Hasura doesn't know about them.

## Quick Fix

### Step 1: Diagnose the Issue

Run the diagnostic script to see what's wrong:

**On Windows (PowerShell):**
```powershell
.\hasura\diagnose.ps1
```

This will check:
- ✅ Hasura is running
- ✅ Database connection
- ✅ Tables exist in database
- ✅ Tables are tracked in Hasura
- ✅ GraphQL schema is available

### Step 2: Apply Migrations (if needed)

If tables don't exist in the database:

**On Windows (PowerShell):**
```powershell
.\hasura\apply-migrations.ps1
```

Or manually:
```powershell
# Connect to PostgreSQL container
docker exec -it resource-scheduler-postgres psql -U scheduler -d scheduler

# Then run the migration SQL
\i /path/to/hasura/migrations/1734700000000_init/up.sql
```

### Step 3: Track Tables

**On Windows (PowerShell) - Recommended:**
```powershell
.\hasura\track-tables-simple.ps1
```

This script uses `Invoke-RestMethod` which handles JSON responses better and has improved error handling.

**Alternative scripts:**
```powershell
# Original script with detailed output
.\hasura\track-tables.ps1

# Or the apply-metadata script
.\hasura\apply-metadata.ps1
```

The script will:
1. Track all 5 tables (employees, departments, shifts, schedules, constraints)
2. Reload metadata
3. Show a summary of what was tracked

**Note:** If tables fail to track, check:
- Tables exist in database (run `.\hasura\diagnose.ps1`)
- Migrations are applied (run `.\hasura\apply-migrations.ps1`)
- Hasura is running (check `docker-compose ps`)

### Alternative: Use Hasura Console

1. Open Hasura Console: http://localhost:8080/console
2. Go to "Data" tab
3. You should see untracked tables
4. Click "Track All" to track all tables
5. Or track tables individually

## Verification

After tracking tables, verify they're in the GraphQL schema:

```powershell
curl -X POST http://localhost:8080/v1/graphql `
  -H "Content-Type: application/json" `
  -H "X-Hasura-Admin-Secret: myadminsecretkey" `
  -d '{\"query\": \"{ __schema { queryType { fields { name } } } }\"}'
```

You should see `employees`, `departments`, `shifts`, `schedules`, and `constraints` in the response.

## Tables Tracked

The following tables are configured in metadata:

- ✅ `employees` - Employee information
- ✅ `departments` - Department information  
- ✅ `shifts` - Shift definitions
- ✅ `schedules` - Employee schedules
- ✅ `constraints` - Scheduling constraints

## Relationships

The following relationships are configured:

- `employees` → `schedules` (one-to-many)
- `departments` → `shifts` (one-to-many)
- `shifts` → `schedules` (one-to-many)
- `schedules` → `employee` (many-to-one)
- `schedules` → `shift` (many-to-one)
- `shifts` → `department` (many-to-one)

## Permissions

All tables have `admin` role permissions configured for:
- ✅ SELECT (read)
- ✅ INSERT (create)
- ✅ UPDATE (modify)
- ✅ DELETE (remove)

The backend uses the admin secret to access these tables.


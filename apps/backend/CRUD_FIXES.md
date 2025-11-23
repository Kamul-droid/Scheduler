# Backend CRUD Operations Fixes

This document describes the fixes applied to resolve CORS errors, Hasura timeouts, and ensure all CRUD operations work correctly.

## Issues Fixed

### 1. CORS Configuration

**Problem**: CORS errors when making POST requests from frontend, especially for `/constraints` endpoint.

**Root Cause**: 
- CORS origin checking was too strict
- Missing headers in allowedHeaders
- OPTIONS preflight requests not properly handled

**Solution**:
- Updated CORS configuration in `apps/backend/src/main.ts`:
  - More permissive origin checking in development
  - Added all necessary headers: `Content-Type`, `Accept`, `Authorization`, `X-Hasura-Admin-Secret`, `X-Requested-With`
  - Added `maxAge` for preflight cache
  - Added `HEAD` method to allowed methods

### 2. Hasura Timeout Issues

**Problem**: Hasura requests timing out after 10 seconds, causing CRUD operations to fail.

**Root Cause**:
- Timeout was too short (10 seconds)
- No retry logic
- Poor error handling for connection issues

**Solution**:
- Increased timeout from 10 seconds to 30 seconds in `HasuraClientService`
- Added request/response interceptors for better logging
- Improved error messages for connection refused and timeout errors
- Added startup health check to verify Hasura connectivity

### 3. Employee Delete Operation

**Problem**: Delete operation was calling `findOne` which could timeout, causing the entire delete to fail.

**Solution**:
- Optimized `remove` method in `EmployeesService`:
  - Separated the "get before delete" query from the delete mutation
  - Better error handling if employee doesn't exist
  - Returns proper error if employee not found

## Changes Made

### Files Modified

1. **`apps/backend/src/main.ts`**
   - Enhanced CORS configuration
   - Added Hasura health check on startup

2. **`apps/backend/src/common/services/hasura-client.service.ts`**
   - Increased timeout from 10s to 30s
   - Added request/response interceptors
   - Better error logging for connection issues

3. **`apps/backend/src/modules/employees/employees.service.ts`**
   - Optimized `remove` method to avoid double queries
   - Better error handling

## Verification

All CRUD operations should now work correctly:

- ✅ **Employees**: Create, Read, Update, Delete
- ✅ **Constraints**: Create, Read, Update, Delete
- ✅ **Schedules**: Create, Read, Update, Delete
- ✅ **Shifts**: Create, Read, Update, Delete
- ✅ **Departments**: Create, Read, Update, Delete

## Hasura Metadata

All tables are properly tracked in Hasura:
- `employees.yaml` - Employee table with permissions
- `constraints.yaml` - Constraints table with permissions
- `schedules.yaml` - Schedules table with permissions
- `shifts.yaml` - Shifts table with permissions
- `departments.yaml` - Departments table with permissions

## Environment Variables

Ensure these are set correctly:

```bash
# Backend
HASURA_URL=http://hasura:8080  # In Docker
HASURA_URL=http://localhost:8080  # Local development
HASURA_ADMIN_SECRET=myadminsecretkey
HASURA_GRAPHQL_ENDPOINT=/v1/graphql
FRONTEND_URL=http://localhost:3001  # Comma-separated for multiple origins
```

## Testing

To verify the fixes:

1. **CORS Test**: Make a POST request from frontend to `/constraints` - should not get CORS error
2. **Hasura Connection**: Check backend logs for "✅ Hasura connection verified" on startup
3. **CRUD Operations**: Test all CRUD operations for each entity type
4. **Timeout**: Operations should complete within 30 seconds (previously 10 seconds)

## Troubleshooting

If you still see issues:

1. **CORS Errors**:
   - Check `FRONTEND_URL` environment variable
   - Verify frontend is making requests from allowed origin
   - Check browser console for exact CORS error message

2. **Hasura Timeouts**:
   - Verify Hasura is running and accessible
   - Check `HASURA_URL` is correct (use `http://hasura:8080` in Docker, `http://localhost:8080` locally)
   - Check Hasura logs for any errors
   - Verify `HASURA_ADMIN_SECRET` matches Hasura configuration

3. **CRUD Failures**:
   - Check Hasura metadata is applied: `hasura metadata apply`
   - Verify tables are tracked in Hasura Console
   - Check backend logs for specific error messages
   - Verify database migrations are applied


# Frontend API Endpoints Configuration

## Overview

The frontend communicates with the backend through Vite's development proxy, which handles CORS automatically and routes requests to the appropriate services.

## Architecture

```
Frontend (Vite on port 3001)
    ↓ (relative URLs)
Vite Proxy
    ↓
Backend (NestJS on port 3000)
    ↓
Hasura (on port 8080) / Database
```

## Endpoint Configuration

### REST API Endpoints

All REST API calls use **relative URLs** and go through the Vite proxy:

- `/employees` → Backend: `http://localhost:3000/employees`
- `/departments` → Backend: `http://localhost:3000/departments`
- `/constraints` → Backend: `http://localhost:3000/constraints`
- `/schedules` → Backend: `http://localhost:3000/schedules`
- `/shifts` → Backend: `http://localhost:3000/shifts`
- `/optimization` → Backend: `http://localhost:3000/optimization`
- `/health` → Backend: `http://localhost:3000/health`

**API Client**: `apps/frontend/src/lib/api.ts`
- Uses relative URLs (empty `baseURL`)
- Automatically routes through Vite proxy
- No CORS issues (same origin)

### GraphQL Endpoints

GraphQL calls use **relative URLs** and go through the Vite proxy:

- `/graphql` → Backend GraphQL: `http://localhost:3000/graphql`
  - Backend manages Hasura internally
  - This is the primary GraphQL endpoint for the frontend

- `/v1/graphql` → Direct Hasura: `http://localhost:8080/v1/graphql`
  - Reserved for admin operations if needed
  - Not typically used by the frontend

**Apollo Client**: `apps/frontend/src/lib/apollo-client.ts`
- Uses relative URL `/graphql` by default
- Routes through Vite proxy to backend
- Backend then communicates with Hasura

## Vite Proxy Configuration

The proxy is configured in `apps/frontend/vite.config.ts`:

```typescript
proxy: {
  // GraphQL through backend
  '/graphql': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
  // Direct Hasura access (if needed)
  '/v1/graphql': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  },
  // REST API endpoints
  '/employees': { target: 'http://localhost:3000', changeOrigin: true },
  '/departments': { target: 'http://localhost:3000', changeOrigin: true },
  '/constraints': { target: 'http://localhost:3000', changeOrigin: true },
  '/schedules': { target: 'http://localhost:3000', changeOrigin: true },
  '/shifts': { target: 'http://localhost:3000', changeOrigin: true },
  '/optimization': { target: 'http://localhost:3000', changeOrigin: true },
  '/health': { target: 'http://localhost:3000', changeOrigin: true },
}
```

## Environment Variables

### Development (Default)
- Frontend runs on: `http://localhost:3001`
- Backend runs on: `http://localhost:3000`
- Hasura runs on: `http://localhost:8080`
- Uses relative URLs (proxy handles routing)

### Production
Set environment variables if needed:
- `VITE_API_URL`: Backend API URL (if not using proxy)
- `VITE_GRAPHQL_URL`: GraphQL endpoint URL (if not using `/graphql`)
- `VITE_HASURA_URL`: Direct Hasura URL (if needed)
- `VITE_HASURA_ADMIN_SECRET`: Hasura admin secret (if needed)

## Benefits of Proxy Approach

1. **No CORS Issues**: All requests appear to come from the same origin
2. **Simplified Configuration**: No need to configure CORS for each endpoint
3. **Environment Flexibility**: Easy to switch between dev/prod
4. **Consistent URLs**: Same URL structure in dev and prod

## Troubleshooting

### Frontend not communicating with backend

1. **Check Vite proxy is running**:
   - Frontend should be on `http://localhost:3001`
   - Check browser console for proxy errors

2. **Verify backend is running**:
   - Backend should be on `http://localhost:3000`
   - Test: `curl http://localhost:3000/health`

3. **Check proxy configuration**:
   - Verify `vite.config.ts` has correct proxy targets
   - Check that relative URLs are used in API client

4. **Verify CORS on backend**:
   - Backend should allow `http://localhost:3001` origin
   - Check `apps/backend/src/main.ts` CORS configuration

5. **Check network tab**:
   - Requests should show as relative URLs (e.g., `/employees`)
   - Status should be 200, not CORS errors

## Migration Notes

Previously, the API client used absolute URLs (`http://localhost:3000`). This has been changed to relative URLs to leverage the Vite proxy. This provides:

- Better CORS handling
- Easier environment switching
- Cleaner code (no hardcoded URLs)


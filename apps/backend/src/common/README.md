# Common Utilities - Exception Handling & Logging

This directory contains shared utilities for exception handling and request/response logging used across the backend application.

## Overview

The common utilities provide:
- **Global Exception Handling**: Consistent error responses across all endpoints
- **Request/Response Logging**: Comprehensive logging with performance monitoring
- **Security**: Sensitive data sanitization in logs

## Components

### 1. HTTP Exception Filter

**Location**: `filters/http-exception.filter.ts`

Global exception filter that catches all unhandled exceptions and returns standardized JSON error responses.

#### Features

- **Universal Exception Handling**: Catches all exceptions (HTTP and non-HTTP)
- **Standardized Error Format**: Consistent JSON response structure
- **Environment-Aware**: Different behavior in development vs production
- **Structured Logging**: Logs errors with appropriate log levels
- **Security**: Hides sensitive information in production

#### How It Works

```typescript
@Catch()  // Catches all exceptions
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 1. Extract HTTP context
    // 2. Determine status code
    // 3. Extract error message
    // 4. Build standardized response
    // 5. Log error details
    // 6. Send response
  }
}
```

#### Response Format

**Production Mode:**
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/employees",
  "method": "POST",
  "message": "Validation failed"
}
```

**Development Mode:**
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/employees",
  "method": "POST",
  "message": "Validation failed",
  "errors": [
    "Email must be a valid email",
    "Name should not be empty"
  ],
  "error": "BadRequestException",
  "stack": "BadRequestException: Validation failed\n    at..."
}
```

#### Status Code Handling

- **HttpException**: Uses the exception's status code
- **Unknown Exceptions**: Defaults to `500 Internal Server Error`
- **Message Extraction**: Handles both string and object responses

#### Logging Behavior

- **5xx Errors**: Logged as `ERROR` with full stack trace
- **4xx Errors**: Logged as `WARN` with error message
- **Development**: Includes stack traces and detailed error information
- **Production**: Generic messages to prevent information leakage

#### Example Scenarios

**Scenario 1: Validation Error**
```typescript
// In controller
throw new BadRequestException('Invalid input data');
```

**Response:**
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/employees",
  "method": "POST",
  "message": "Invalid input data"
}
```

**Scenario 2: Database Error**
```typescript
// Unexpected error
throw new Error('Database connection failed');
```

**Response (Production):**
```json
{
  "statusCode": 500,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/schedules",
  "method": "GET",
  "message": "Internal server error"
}
```

**Response (Development):**
```json
{
  "statusCode": 500,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/schedules",
  "method": "GET",
  "message": "Internal server error",
  "error": "Error",
  "stack": "Error: Database connection failed\n    at..."
}
```

**Scenario 3: Validation with Array**
```typescript
throw new BadRequestException({
  message: 'Validation failed',
  errors: ['Email required', 'Name too short']
});
```

**Response:**
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/employees",
  "method": "POST",
  "message": "Validation failed",
  "errors": ["Email required", "Name too short"]
}
```

#### Registration

Registered globally in `main.ts`:
```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

---

### 2. Logging Interceptor

**Location**: `interceptors/logging.interceptor.ts`

Global interceptor that logs all HTTP requests and responses with performance metrics and security features.

#### Features

- **Request Logging**: Logs incoming requests with metadata
- **Response Logging**: Logs responses with status codes and timing
- **Performance Monitoring**: Detects and warns about slow requests
- **Security**: Sanitizes sensitive data before logging
- **Structured Logging**: Uses NestJS Logger with appropriate log levels
- **Error Tracking**: Logs errors with context and timing

#### How It Works

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 1. Extract request details
    // 2. Start timer
    // 3. Log incoming request
    // 4. Continue to handler
    // 5. On response: calculate time, log result
    // 6. Handle errors if any
  }
}
```

#### Log Levels

The interceptor uses different log levels based on response status and performance:

- **`logger.error()`**: 5xx server errors
- **`logger.warn()`**: 4xx client errors + slow requests (>1000ms)
- **`logger.log()`**: Successful requests (2xx, 3xx)
- **`logger.debug()`**: Detailed request/response data (development only)

#### Logged Information

**Standard Logs:**
- HTTP method (GET, POST, etc.)
- Request URL
- Response status code
- Response time in milliseconds
- Client IP address
- User-Agent

**Development Mode (Additional):**
- Query parameters
- Request body (sanitized)
- Full request metadata

#### Performance Monitoring

**Slow Request Detection:**
- Threshold: 1000ms (1 second)
- Slow requests are logged as warnings
- Helps identify performance bottlenecks

**Example:**
```
[LoggingInterceptor] POST /api/optimize 200 - 1250ms - SLOW REQUEST (threshold: 1000ms)
```

#### Security Features

**Body Sanitization:**
Automatically redacts sensitive fields from request bodies:
- `password`
- `token`
- `secret`
- `apiKey`
- `auth`

**Example:**
```json
// Original request body
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}

// Logged (sanitized)
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "***REDACTED***"
}
```

#### Example Log Output

**Normal Request:**
```
[LoggingInterceptor] Incoming request: GET /api/employees - IP: 192.168.1.1 - User-Agent: Mozilla/5.0...
[LoggingInterceptor] GET /api/employees 200 - 45ms
```

**Client Error:**
```
[LoggingInterceptor] Incoming request: POST /api/employees - IP: 192.168.1.1 - User-Agent: Mozilla/5.0...
[LoggingInterceptor] POST /api/employees 400 - 12ms
```

**Server Error:**
```
[LoggingInterceptor] Incoming request: GET /api/schedules - IP: 192.168.1.1 - User-Agent: Mozilla/5.0...
[LoggingInterceptor] GET /api/schedules 500 - 234ms
[LoggingInterceptor] GET /api/schedules - Error after 234ms
Error: Database connection failed
    at ScheduleService.findAll (schedule.service.ts:45)
    ...
```

**Slow Request:**
```
[LoggingInterceptor] Incoming request: POST /api/optimize - IP: 192.168.1.1 - User-Agent: Mozilla/5.0...
[LoggingInterceptor] POST /api/optimize 200 - 1250ms - SLOW REQUEST (threshold: 1000ms)
```

**Development Mode (with debug details):**
```
[LoggingInterceptor] Incoming request: POST /api/employees - IP: 192.168.1.1 - User-Agent: Mozilla/5.0...
[LoggingInterceptor] POST /api/employees 201 - 89ms
[LoggingInterceptor] Request details: {
  "query": {},
  "body": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "***REDACTED***"
  },
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

#### Error Handling

The interceptor handles errors in two ways:

1. **In `tap()` operator**: Logs errors that occur during response processing
2. **In `catchError()` operator**: Catches and re-throws errors for the exception filter

Both log the error with context (method, URL, response time) before the exception filter handles it.

#### Configuration

**Slow Request Threshold:**
```typescript
private readonly slowRequestThreshold = 1000; // 1 second
```

Can be adjusted based on application requirements.

#### Registration

Registered globally in `main.ts`:
```typescript
app.useGlobalInterceptors(new LoggingInterceptor());
```

---

## Integration

Both components work together to provide comprehensive request/response handling:

### Request Flow

```
1. Request arrives
   ↓
2. LoggingInterceptor logs incoming request
   ↓
3. Request processed by controller/service
   ↓
4. LoggingInterceptor logs response (success or error)
   ↓
5. If error: HttpExceptionFilter catches and formats error
   ↓
6. Response sent to client
```

### Example: Complete Request Lifecycle

**Successful Request:**
```
[LoggingInterceptor] Incoming request: GET /api/employees - IP: 192.168.1.1
[LoggingInterceptor] GET /api/employees 200 - 45ms
```

**Request with Error:**
```
[LoggingInterceptor] Incoming request: POST /api/employees - IP: 192.168.1.1
[LoggingInterceptor] POST /api/employees 400 - 12ms
[HttpExceptionFilter] WARN: POST /api/employees - 400 - Validation failed
```

**Request with Server Error:**
```
[LoggingInterceptor] Incoming request: GET /api/schedules - IP: 192.168.1.1
[LoggingInterceptor] GET /api/schedules 500 - 234ms
[LoggingInterceptor] GET /api/schedules - Error after 234ms
[HttpExceptionFilter] ERROR: GET /api/schedules - 500
Error: Database connection failed
    at ScheduleService.findAll (schedule.service.ts:45)
```

---

## Best Practices

### Exception Filter

1. **Use HttpException for expected errors**: Provides better error messages
   ```typescript
   throw new BadRequestException('Invalid input');
   ```

2. **Use specific exception types**: Better status codes and messages
   ```typescript
   throw new NotFoundException('Employee not found');
   throw new UnauthorizedException('Invalid credentials');
   ```

3. **Include validation errors**: Help frontend display specific field errors
   ```typescript
   throw new BadRequestException({
     message: 'Validation failed',
     errors: ['Email required', 'Name too short']
   });
   ```

### Logging Interceptor

1. **Monitor slow requests**: Review warnings for performance issues
2. **Check error logs**: Use error logs to identify problematic endpoints
3. **Development debugging**: Use debug logs in development for troubleshooting
4. **Security**: Never log sensitive data - the interceptor sanitizes automatically

---

## Customization

### Adjusting Slow Request Threshold

Edit `logging.interceptor.ts`:
```typescript
private readonly slowRequestThreshold = 2000; // 2 seconds
```

### Adding More Sensitive Fields

Edit `sanitizeBody()` method:
```typescript
const sensitiveFields = [
  'password',
  'token',
  'secret',
  'apiKey',
  'auth',
  'creditCard', // Add your fields
  'ssn',
];
```

### Customizing Error Response Format

Edit `http-exception.filter.ts` to modify the response structure:
```typescript
const errorResponse: any = {
  statusCode: status,
  timestamp: new Date().toISOString(),
  path: request.url,
  method: request.method,
  message,
  // Add custom fields
  requestId: request.id, // If using request ID middleware
};
```

---

## Testing

### Testing Exception Filter

```typescript
// In your test
it('should format error response correctly', async () => {
  const response = await request(app.getHttpServer())
    .post('/api/employees')
    .send({ invalid: 'data' });
  
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('statusCode', 400);
  expect(response.body).toHaveProperty('timestamp');
  expect(response.body).toHaveProperty('path');
  expect(response.body).toHaveProperty('message');
});
```

### Testing Logging Interceptor

The interceptor logs automatically. In tests, you can verify logs are generated:
```typescript
// Mock logger or check console output
const loggerSpy = jest.spyOn(Logger.prototype, 'log');
// Make request
expect(loggerSpy).toHaveBeenCalled();
```

---

## Troubleshooting

### Issue: Errors not being caught

**Solution**: Ensure the filter is registered globally in `main.ts`:
```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

### Issue: Sensitive data in logs

**Solution**: Check that `sanitizeBody()` includes all sensitive fields. Add missing fields to the `sensitiveFields` array.

### Issue: Too many logs in production

**Solution**: The interceptor uses appropriate log levels. Adjust log level configuration in your logging setup (e.g., only show warnings and errors in production).

### Issue: Slow request threshold too sensitive

**Solution**: Adjust `slowRequestThreshold` in `logging.interceptor.ts`:
```typescript
private readonly slowRequestThreshold = 2000; // Increase threshold
```

---

## Related Documentation

- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [NestJS Logger](https://docs.nestjs.com/techniques/logger)

---

## Summary

These common utilities provide:

✅ **Consistent error handling** across all endpoints  
✅ **Comprehensive request/response logging**  
✅ **Performance monitoring** with slow request detection  
✅ **Security** through data sanitization  
✅ **Production-ready** with environment-aware behavior  
✅ **Developer-friendly** with detailed debug information in development

Both components are automatically applied to all HTTP requests when registered globally, ensuring consistent behavior across the entire application.


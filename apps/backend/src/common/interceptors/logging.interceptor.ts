import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  private readonly slowRequestThreshold = 1000; // 1 second

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers, query, body } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `Incoming request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Build log message
          const logMessage = `${method} ${url} ${statusCode} - ${responseTime}ms`;

          // Log based on status code and response time
          if (statusCode >= 500) {
            // Server errors - already logged by exception filter, but log here too
            this.logger.error(logMessage);
          } else if (statusCode >= 400) {
            // Client errors - log as warning
            this.logger.warn(logMessage);
          } else if (responseTime > this.slowRequestThreshold) {
            // Slow requests - log as warning
            this.logger.warn(
              `${logMessage} - SLOW REQUEST (threshold: ${this.slowRequestThreshold}ms)`,
            );
          } else {
            // Normal requests - log as info
            this.logger.log(logMessage);
          }

          // Log additional details in development mode
          if (process.env.NODE_ENV === 'development') {
            this.logger.debug(
              `Request details: ${JSON.stringify({
                query: Object.keys(query).length > 0 ? query : undefined,
                body: this.sanitizeBody(body),
                ip,
                userAgent,
              })}`,
            );
          }
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          // Errors are handled by exception filter, but log here for completeness
          this.logger.error(
            `${method} ${url} - Error after ${responseTime}ms`,
            error.stack,
          );
        },
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        this.logger.error(
          `${method} ${url} - Error after ${responseTime}ms`,
          error.stack,
        );
        return throwError(() => error);
      }),
    );
  }

  /**
   * Sanitizes request body for logging (removes sensitive data)
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'auth'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}


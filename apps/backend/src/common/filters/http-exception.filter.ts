import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    // Extract message from exception response (can be string or object)
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any)?.message || 'Internal server error';

    // Build error response
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    // Include additional details in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // Include error details and stack trace in development
      if (exception instanceof Error) {
        errorResponse.error = exception.name;
        errorResponse.stack = exception.stack;
      }

      // Include validation errors if present
      if (
        exception instanceof HttpException &&
        typeof exceptionResponse === 'object' &&
        (exceptionResponse as any)?.message
      ) {
        const responseObj = exceptionResponse as any;
        if (Array.isArray(responseObj.message)) {
          errorResponse.errors = responseObj.message;
        }
      }
    }

    // Log error details
    if (status >= 500) {
      // Log server errors with full details
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else if (status >= 400) {
      // Log client errors with less detail
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
    }

    // Send response
    response.status(status).json(errorResponse);
  }
}


import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Check Hasura connectivity on startup
  try {
    const { HasuraClientService } = await import('./common/services/hasura-client.service');
    const hasuraClient = new HasuraClientService();
    const isHealthy = await hasuraClient.checkHealth();
    if (!isHealthy) {
      console.warn('⚠️  Warning: Hasura is not accessible. Some features may not work.');
    } else {
      console.log('✅ Hasura connection verified');
    }
  } catch (error) {
    console.warn('⚠️  Warning: Could not verify Hasura connection:', error.message);
  }

  // Enable CORS for frontend communication
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
  
  // Log CORS configuration
  console.log('CORS Configuration:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`  FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}`);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('CORS: Allowing request with no origin');
        return callback(null, true);
      }
      
      console.log(`CORS: Checking origin: ${origin}`);
      
      // Allow all origins if:
      // 1. NODE_ENV is not set to 'production'
      // 2. FRONTEND_URL is not explicitly set (defaults to permissive)
      const isProduction = process.env.NODE_ENV === 'production';
      const hasExplicitFrontendUrl = !!process.env.FRONTEND_URL;
      
      // If not in production OR no explicit FRONTEND_URL set, allow all origins
      if (!isProduction || !hasExplicitFrontendUrl) {
        console.log(`CORS: Allowing origin ${origin} (isProduction: ${isProduction}, hasExplicitFrontendUrl: ${hasExplicitFrontendUrl})`);
        return callback(null, true);
      }
      
      // Check if origin is in allowed list (case-insensitive, with/without trailing slash)
      const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
      const isAllowed = allowedOrigins.some((allowed) => {
        const normalizedAllowed = allowed.toLowerCase().replace(/\/$/, '');
        return normalizedOrigin === normalizedAllowed;
      });
      
      if (isAllowed) {
        console.log(`CORS: Origin ${origin} is allowed`);
        return callback(null, true);
      }
      
      // Log rejection for debugging
      console.warn(`CORS: Rejecting origin ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error(`Not allowed by CORS: ${origin} is not in the allowed origins list`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Hasura-Admin-Secret',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend server running on http://localhost:${port}`);
}

bootstrap();


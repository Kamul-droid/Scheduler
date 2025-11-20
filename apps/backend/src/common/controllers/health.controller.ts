import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService } from '../services/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check() {
    const healthStatus = await this.healthService.checkHealth();

    // Return appropriate HTTP status based on health
    if (healthStatus.status === 'unhealthy') {
      // Return 503 Service Unavailable if unhealthy
      return healthStatus;
    }

    // Return 200 OK for healthy or degraded
    return healthStatus;
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness() {
    const healthStatus = await this.healthService.checkHealth();

    // Readiness check: backend, Hasura, and database must be healthy
    const isReady =
      healthStatus.checks.backend.status === 'ok' &&
      healthStatus.checks.hasura.status === 'ok' &&
      healthStatus.checks.database.status === 'ok';

    if (!isReady) {
      return {
        status: 'not ready',
        timestamp: healthStatus.timestamp,
        message: 'Service dependencies are not ready',
        checks: {
          backend: healthStatus.checks.backend,
          hasura: healthStatus.checks.hasura,
          database: healthStatus.checks.database,
        },
      };
    }

    return {
      status: 'ready',
      timestamp: healthStatus.timestamp,
      message: 'Service is ready to accept traffic',
    };
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness() {
    // Liveness check: just verify the service is running
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'backend',
    };
  }
}


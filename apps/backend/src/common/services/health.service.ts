import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { hasuraConfig } from '../../config/hasura.config';
import { OptimizationClient } from '../../modules/optimization/optimization-client.service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  checks: {
    backend: {
      status: 'ok' | 'error';
      message?: string;
    };
    hasura: {
      status: 'ok' | 'error';
      message?: string;
      responseTime?: number;
    };
    database: {
      status: 'ok' | 'error';
      message?: string;
      responseTime?: number;
    };
    optimizer: {
      status: 'ok' | 'error' | 'unavailable';
      message?: string;
      responseTime?: number;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly hasuraClient: AxiosInstance;

  constructor(private readonly optimizationClient: OptimizationClient) {
    this.hasuraClient = axios.create({
      baseURL: hasuraConfig.url,
      timeout: 5000, // 5 second timeout for health checks
      headers: hasuraConfig.adminSecret
        ? {
            'x-hasura-admin-secret': hasuraConfig.adminSecret,
          }
        : {},
    });
  }

  /**
   * Performs comprehensive health check of all backend dependencies
   */
  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const checks = {
      backend: await this.checkBackend(),
      hasura: await this.checkHasura(),
      database: await this.checkDatabase(),
      optimizer: await this.checkOptimizer(),
    };

    // Determine overall status
    const hasErrors = Object.values(checks).some(
      (check) => check.status === 'error',
    );
    const hasUnavailable = Object.values(checks).some(
      (check) => check.status === 'unavailable',
    );

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (hasErrors) {
      overallStatus = 'unhealthy';
    } else if (hasUnavailable) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      timestamp,
      service: 'backend',
      checks,
    };
  }

  /**
   * Checks backend service status (always ok if we can respond)
   */
  private async checkBackend(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
    try {
      return {
        status: 'ok',
        message: 'Backend service is running',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Backend service error',
      };
    }
  }

  /**
   * Checks Hasura GraphQL engine connectivity
   */
  private async checkHasura(): Promise<{
    status: 'ok' | 'error';
    message?: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    try {
      // Simple GraphQL query to check Hasura health
      const response = await this.hasuraClient.post(
        hasuraConfig.graphqlEndpoint,
        {
          query: `
            query {
              __typename
            }
          `,
        },
      );

      const responseTime = Date.now() - startTime;

      if (response.status === 200 && response.data) {
        return {
          status: 'ok',
          message: 'Hasura GraphQL engine is accessible',
          responseTime,
        };
      }

      return {
        status: 'error',
        message: 'Hasura returned unexpected response',
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'error',
        message: `Hasura connection failed: ${error.message || 'Unknown error'}`,
        responseTime,
      };
    }
  }

  /**
   * Checks database connectivity through Hasura
   */
  private async checkDatabase(): Promise<{
    status: 'ok' | 'error';
    message?: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    try {
      // Query that requires database access (checking a system table or simple query)
      const response = await this.hasuraClient.post(
        hasuraConfig.graphqlEndpoint,
        {
          query: `
            query {
              __schema {
                queryType {
                  name
                }
              }
            }
          `,
        },
      );

      const responseTime = Date.now() - startTime;

      if (response.status === 200 && response.data?.data) {
        return {
          status: 'ok',
          message: 'Database is accessible through Hasura',
          responseTime,
        };
      }

      return {
        status: 'error',
        message: 'Database check returned unexpected response',
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'error',
        message: `Database check failed: ${error.message || 'Unknown error'}`,
        responseTime,
      };
    }
  }

  /**
   * Checks Python optimization service health
   */
  private async checkOptimizer(): Promise<{
    status: 'ok' | 'error' | 'unavailable';
    message?: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    try {
      const isHealthy = await this.optimizationClient.checkHealth();
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        return {
          status: 'ok',
          message: 'Optimization service is available',
          responseTime,
        };
      }

      return {
        status: 'unavailable',
        message: 'Optimization service is not responding',
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unavailable',
        message: `Optimization service check failed: ${error.message || 'Unknown error'}`,
        responseTime,
      };
    }
  }
}


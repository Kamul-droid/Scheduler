import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';

@Injectable()
export class OptimizationClient {
  private readonly logger = new Logger(OptimizationClient.name);
  private readonly client: AxiosInstance;
  private readonly optimizerUrl: string;

  constructor() {
    this.optimizerUrl =
      process.env.OPTIMIZER_SERVICE_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.optimizerUrl,
      timeout: 30000, // 30 seconds timeout for optimization
    });
    
    this.logger.log(`OptimizationClient initialized with URL: ${this.optimizerUrl}`);
  }

  /**
   * Sends optimization request to Python service
   */
  async requestOptimization(optimizationData: any) {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Sending optimization request to container', {
        url: `${this.optimizerUrl}/optimize`,
        dataSize: JSON.stringify(optimizationData).length,
        employeeCount: optimizationData?.employees?.length || 0,
        shiftCount: optimizationData?.shifts?.length || 0,
        constraintCount: optimizationData?.constraints?.length || 0,
        startDate: optimizationData?.startDate,
        endDate: optimizationData?.endDate,
      });

      const response = await this.client.post('/optimize', optimizationData);
      const responseTime = Date.now() - startTime;

      this.logger.log(`Optimization container responded successfully in ${responseTime}ms`, {
        httpStatus: response.status,
        httpStatusText: response.statusText,
        hasData: !!response.data,
        responseKeys: response.data ? Object.keys(response.data) : [],
        optimizationId: response.data?.optimizationId,
        optimizationStatus: response.data?.status,
        solutionCount: Array.isArray(response.data?.solutions) ? response.data.solutions.length : 0,
        totalSolveTime: response.data?.totalSolveTime,
        message: response.data?.message,
      });

      // Log detailed response structure in debug mode
      if (response.data) {
        this.logger.debug('Optimization container response details', {
          fullResponse: JSON.stringify(response.data, null, 2),
        });
      }

      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        this.logger.error(`Optimization container request failed after ${responseTime}ms`, {
          message: axiosError.message,
          code: axiosError.code,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          responseData: axiosError.response?.data,
          requestUrl: axiosError.config?.url,
          requestMethod: axiosError.config?.method,
        });

        // Log response body if available (might contain useful error info)
        if (axiosError.response?.data) {
          this.logger.error('Container error response body', {
            errorResponse: JSON.stringify(axiosError.response.data, null, 2),
          });
        }

        // If container returned a response but with error status, log it
        if (axiosError.response) {
          const errorMessage = 
            (axiosError.response.data as any)?.message || 
            (axiosError.response.data as any)?.error ||
            axiosError.message;
          throw new Error(`Optimization container error: ${errorMessage}`);
        }

        // Network/timeout errors
        if (axiosError.code === 'ECONNREFUSED') {
          this.logger.error(`Cannot connect to optimization container at ${this.optimizerUrl}`);
          throw new Error(`Cannot connect to optimization service at ${this.optimizerUrl}`);
        } else if (axiosError.code === 'ETIMEDOUT') {
          this.logger.error(`Optimization container request timed out after ${this.client.defaults.timeout}ms`);
          throw new Error('Optimization request timed out');
        }
      }

      // Generic error handling
      this.logger.error('Unexpected error in optimization request', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new Error(`Failed to get optimization solution: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Checks health of optimization service
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      this.logger.debug(`Health check successful: ${response.status}`);
      return response.status === 200;
    } catch (error) {
      this.logger.warn('Health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}


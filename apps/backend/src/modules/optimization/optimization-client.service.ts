import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class OptimizationClient {
  private readonly client: AxiosInstance;
  private readonly optimizerUrl: string;

  constructor() {
    this.optimizerUrl =
      process.env.OPTIMIZER_SERVICE_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.optimizerUrl,
      timeout: 30000, // 30 seconds timeout for optimization
    });
  }

  /**
   * Sends optimization request to Python service
   */
  async requestOptimization(optimizationData: any) {
    try {
      const response = await this.client.post('/optimize', optimizationData);
      return response.data;
    } catch (error) {
      console.error('Optimization service error:', error);
      throw new Error('Failed to get optimization solution');
    }
  }

  /**
   * Checks health of optimization service
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}


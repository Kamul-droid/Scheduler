import { Injectable } from '@nestjs/common';
import { OptimizationOrchestrator } from './optimization-orchestrator.service';

@Injectable()
export class OptimizationService {
  constructor(
    private readonly optimizationOrchestrator: OptimizationOrchestrator,
  ) {}

  /**
   * Triggers schedule optimization
   */
  async optimizeSchedule(optimizationRequest: any) {
    return this.optimizationOrchestrator.optimize(optimizationRequest);
  }

  /**
   * Gets optimization status
   */
  async getOptimizationStatus(optimizationId: string) {
    return this.optimizationOrchestrator.getStatus(optimizationId);
  }
}


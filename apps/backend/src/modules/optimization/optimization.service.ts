import { Injectable, NotFoundException } from '@nestjs/common';
import { OptimizationRequestDto } from './dto/optimization-request.dto';
import { OptimizationResult } from './dto/optimization-result.dto';
import { OptimizationOrchestrator } from './optimization-orchestrator.service';

@Injectable()
export class OptimizationService {
  constructor(
    private readonly optimizationOrchestrator: OptimizationOrchestrator,
  ) {}

  /**
   * Triggers schedule optimization
   */
  async optimizeSchedule(
    optimizationRequest: OptimizationRequestDto,
  ): Promise<OptimizationResult> {
    return this.optimizationOrchestrator.optimize(optimizationRequest);
  }

  /**
   * Gets optimization status
   */
  async getOptimizationStatus(
    optimizationId: string,
  ): Promise<OptimizationResult> {
    const result = await this.optimizationOrchestrator.getStatus(
      optimizationId,
    );

    if (!result) {
      throw new NotFoundException(
        `Optimization with ID ${optimizationId} not found`,
      );
    }

    return result;
  }
}


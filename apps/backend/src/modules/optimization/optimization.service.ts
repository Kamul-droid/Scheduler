import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OptimizationRequestDto } from './dto/optimization-request.dto';
import { OptimizationResult } from './dto/optimization-result.dto';
import { OptimizationOrchestrator } from './optimization-orchestrator.service';

@Injectable()
export class OptimizationService {
  private readonly logger = new Logger(OptimizationService.name);

  constructor(
    private readonly optimizationOrchestrator: OptimizationOrchestrator,
  ) {}

  /**
   * Triggers schedule optimization
   */
  async optimizeSchedule(
    optimizationRequest: OptimizationRequestDto,
  ): Promise<OptimizationResult> {
    this.logger.log('Optimization schedule request received', {
      startDate: optimizationRequest.startDate,
      endDate: optimizationRequest.endDate,
      employeeIds: optimizationRequest.employeeIds,
      hasOptions: !!optimizationRequest.options,
    });

    try {
      const result = await this.optimizationOrchestrator.optimize(optimizationRequest);
      
      this.logger.log('Optimization schedule completed', {
        optimizationId: result.optimizationId,
        status: result.status,
        solutionCount: result.solutions.length,
        totalSolveTime: result.totalSolveTime,
        message: result.message,
      });

      return result;
    } catch (error) {
      this.logger.error('Optimization schedule failed in service layer', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Gets optimization status
   */
  async getOptimizationStatus(
    optimizationId: string,
  ): Promise<OptimizationResult> {
    this.logger.debug(`Getting optimization status for ID: ${optimizationId}`);
    
    const result = await this.optimizationOrchestrator.getStatus(
      optimizationId,
    );

    if (!result) {
      this.logger.warn(`Optimization not found: ${optimizationId}`);
      throw new NotFoundException(
        `Optimization with ID ${optimizationId} not found`,
      );
    }

    this.logger.debug(`Optimization status retrieved`, {
      optimizationId: result.optimizationId,
      status: result.status,
      solutionCount: result.solutions.length,
    });

    return result;
  }
}


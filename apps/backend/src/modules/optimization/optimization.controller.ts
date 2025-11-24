import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { OptimizationService } from './optimization.service';
import { OptimizationRequestDto } from './dto/optimization-request.dto';

@Controller('optimization')
export class OptimizationController {
  private readonly logger = new Logger(OptimizationController.name);

  constructor(private readonly optimizationService: OptimizationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async optimize(@Body() optimizationRequest: OptimizationRequestDto) {
    this.logger.log('POST /optimization - Optimization request received', {
      startDate: optimizationRequest.startDate,
      endDate: optimizationRequest.endDate,
      employeeIds: optimizationRequest.employeeIds?.length || 0,
      hasOptions: !!optimizationRequest.options,
    });

    try {
      const result = await this.optimizationService.optimizeSchedule(optimizationRequest);
      
      this.logger.log('POST /optimization - Optimization request completed', {
        optimizationId: result.optimizationId,
        status: result.status,
        solutionCount: result.solutions.length,
        totalSolveTime: result.totalSolveTime,
      });

      return result;
    } catch (error) {
      this.logger.error('POST /optimization - Optimization request failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  @Get(':id')
  async getStatus(@Param('id') id: string) {
    this.logger.debug(`GET /optimization/${id} - Status request received`);
    
    try {
      const result = await this.optimizationService.getOptimizationStatus(id);
      
      this.logger.debug(`GET /optimization/${id} - Status retrieved`, {
        status: result.status,
        solutionCount: result.solutions.length,
      });

      return result;
    } catch (error) {
      this.logger.warn(`GET /optimization/${id} - Status request failed`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}


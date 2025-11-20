import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OptimizationService } from './optimization.service';
import { OptimizationRequestDto } from './dto/optimization-request.dto';

@Controller('optimization')
export class OptimizationController {
  constructor(private readonly optimizationService: OptimizationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  optimize(@Body() optimizationRequest: OptimizationRequestDto) {
    return this.optimizationService.optimizeSchedule(optimizationRequest);
  }

  @Get(':id')
  getStatus(@Param('id') id: string) {
    return this.optimizationService.getOptimizationStatus(id);
  }
}


import { Module } from '@nestjs/common';
import { OptimizationClient } from './optimization-client.service';
import { OptimizationOrchestrator } from './optimization-orchestrator.service';
import { OptimizationResolver } from './optimization.resolver';
import { OptimizationService } from './optimization.service';

@Module({
  providers: [
    OptimizationService,
    OptimizationResolver,
    OptimizationOrchestrator,
    OptimizationClient,
  ],
  exports: [OptimizationService, OptimizationOrchestrator, OptimizationClient],
})
export class OptimizationModule {}


import { Module, forwardRef } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { OptimizationClient } from './optimization-client.service';
import { OptimizationOrchestrator } from './optimization-orchestrator.service';
import { OptimizationController } from './optimization.controller';
import { OptimizationResolver } from './optimization.resolver';
import { OptimizationService } from './optimization.service';

@Module({
  imports: [forwardRef(() => CommonModule)],
  providers: [
    OptimizationService,
    OptimizationResolver,
    OptimizationOrchestrator,
    OptimizationClient,
  ],
  controllers: [OptimizationController],
  exports: [OptimizationService, OptimizationOrchestrator, OptimizationClient],
})
export class OptimizationModule {}


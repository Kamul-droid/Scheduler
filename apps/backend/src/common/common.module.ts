import { Module } from '@nestjs/common';
import { OptimizationModule } from '../modules/optimization/optimization.module';
import { HealthController } from './controllers/health.controller';
import { HealthService } from './services/health.service';

@Module({
  imports: [OptimizationModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class CommonModule {}


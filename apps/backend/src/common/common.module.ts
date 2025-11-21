import { Module, forwardRef } from '@nestjs/common';
import { OptimizationModule } from '../modules/optimization/optimization.module';
import { HealthController } from './controllers/health.controller';
import { HasuraClientService } from './services/hasura-client.service';
import { HealthService } from './services/health.service';

@Module({
  imports: [forwardRef(() => OptimizationModule)],
  controllers: [HealthController],
  providers: [HealthService, HasuraClientService],
  exports: [HealthService, HasuraClientService],
})
export class CommonModule {}


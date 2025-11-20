import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ConstraintsService } from './constraints.service';
import { ConstraintsResolver } from './constraints.resolver';
import { ConstraintsController } from './constraints.controller';
import { RuleEngineService } from './rule-engine.service';

@Module({
  imports: [CommonModule],
  providers: [ConstraintsService, ConstraintsResolver, RuleEngineService],
  controllers: [ConstraintsController],
  exports: [ConstraintsService, RuleEngineService],
})
export class ConstraintsModule {}


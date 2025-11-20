import { Module } from '@nestjs/common';
import { ConstraintsService } from './constraints.service';
import { ConstraintsResolver } from './constraints.resolver';
import { RuleEngineService } from './rule-engine.service';

@Module({
  providers: [ConstraintsService, ConstraintsResolver, RuleEngineService],
  exports: [ConstraintsService, RuleEngineService],
})
export class ConstraintsModule {}


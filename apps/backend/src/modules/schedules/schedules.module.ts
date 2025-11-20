import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ConstraintsModule } from '../constraints/constraints.module';
import { ConflictDetectionService } from './conflict-detection.service';
import { SchedulesController } from './schedules.controller';
import { ScheduleResolver } from './schedules.resolver';
import { SchedulesService } from './schedules.service';
import { ValidationService } from './validation.service';

@Module({
  imports: [CommonModule, ConstraintsModule],
  providers: [
    SchedulesService,
    ScheduleResolver,
    ConflictDetectionService,
    ValidationService,
  ],
  controllers: [SchedulesController],
  exports: [SchedulesService, ConflictDetectionService, ValidationService],
})
export class SchedulesModule {}


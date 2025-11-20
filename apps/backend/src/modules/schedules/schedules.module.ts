import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { ScheduleResolver } from './schedules.resolver';
import { ConflictDetectionService } from './conflict-detection.service';
import { ValidationService } from './validation.service';

@Module({
  providers: [
    SchedulesService,
    ScheduleResolver,
    ConflictDetectionService,
    ValidationService,
  ],
  exports: [SchedulesService, ConflictDetectionService, ValidationService],
})
export class SchedulesModule {}


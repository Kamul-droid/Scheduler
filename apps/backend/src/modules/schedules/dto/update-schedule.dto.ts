import { InputType, PartialType } from '@nestjs/graphql';
import { CreateScheduleDto } from './create-schedule.dto';

@InputType()
export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}


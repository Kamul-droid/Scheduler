import { Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';
import { ScheduleStatus } from '../../../common/types/schedule-status.enum';

registerEnumType(ScheduleStatus, {
  name: 'ScheduleStatus',
  description: 'Status of a schedule assignment',
});

@InputType()
export class CreateScheduleDto {
  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  @Field(() => ID)
  @IsUUID()
  shiftId: string;

  @Field()
  @IsDateString()
  startTime: string;

  @Field()
  @IsDateString()
  endTime: string;

  @Field(() => ScheduleStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: any; // Flexible metadata
}


import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { ScheduleStatus } from '../../../common/types/schedule-status.enum';

registerEnumType(ScheduleStatus, {
  name: 'ScheduleStatus',
  description: 'Status of a schedule assignment',
});

@ObjectType()
export class Schedule {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  employeeId: string;

  @Field(() => ID)
  shiftId: string;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;

  @Field(() => ScheduleStatus)
  status: ScheduleStatus;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any; // Flexible metadata stored as JSONB

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}


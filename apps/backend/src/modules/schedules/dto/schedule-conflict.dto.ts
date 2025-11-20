import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ScheduleConflict {
  @Field(() => ID)
  scheduleId: string;

  @Field(() => ID)
  conflictingScheduleId: string;

  @Field()
  message: string;

  @Field()
  severity: 'warning' | 'error';
}


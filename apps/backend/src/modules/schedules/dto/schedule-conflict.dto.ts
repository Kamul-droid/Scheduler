import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ScheduleConflict {
  @Field()
  type: string; // 'overlap', 'constraint_violation', 'skill_mismatch'

  @Field()
  message: string;

  @Field(() => String, { nullable: true })
  details?: Record<string, any>;
}


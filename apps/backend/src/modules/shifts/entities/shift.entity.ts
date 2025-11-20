import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class Shift {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  departmentId: string;

  @Field(() => GraphQLJSON, { nullable: true })
  requiredSkills?: any; // Array of Skill objects stored as JSONB

  @Field()
  minStaffing: number;

  @Field()
  maxStaffing: number;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any; // Flexible metadata stored as JSONB

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}


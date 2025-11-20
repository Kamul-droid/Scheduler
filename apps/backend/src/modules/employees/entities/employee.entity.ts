import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class Employee {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => GraphQLJSON, { nullable: true })
  skills?: any; // Array of Skill objects stored as JSONB

  @Field(() => GraphQLJSON, { nullable: true })
  availabilityPattern?: any; // AvailabilityPattern stored as JSONB

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any; // Flexible metadata stored as JSONB

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}


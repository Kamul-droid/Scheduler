import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class Department {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => GraphQLJSON, { nullable: true })
  requirements?: any; // Department requirements stored as JSONB

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}


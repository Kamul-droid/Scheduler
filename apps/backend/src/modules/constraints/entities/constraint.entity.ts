import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { ConstraintType } from '../../../common/types/constraint-type.enum';
import { GraphQLJSON } from 'graphql-scalars';

registerEnumType(ConstraintType, {
  name: 'ConstraintType',
  description: 'Type of constraint rule',
});

@ObjectType()
export class Constraint {
  @Field(() => ID)
  id: string;

  @Field(() => ConstraintType)
  type: ConstraintType;

  @Field(() => GraphQLJSON)
  rules: any; // Flexible constraint rules stored as JSONB

  @Field()
  priority: number;

  @Field()
  active: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}


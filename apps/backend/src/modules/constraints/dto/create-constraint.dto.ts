import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';
import { ConstraintType } from '../../../common/types/constraint-type.enum';

registerEnumType(ConstraintType, {
  name: 'ConstraintType',
  description: 'Type of constraint rule',
});

@InputType()
export class CreateConstraintDto {
  @Field(() => ConstraintType)
  @IsEnum(ConstraintType)
  type: ConstraintType;

  @Field(() => GraphQLJSON)
  rules: any; // Flexible constraint rules

  @Field()
  @IsInt()
  @Min(0)
  @Max(100)
  priority: number;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}


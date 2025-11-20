import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class CreateDepartmentDto {
  @Field()
  @IsString()
  name: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  requirements?: any; // Department requirements
}


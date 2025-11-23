import { Field, InputType } from '@nestjs/graphql';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class CreateDepartmentDto {
  @Field()
  @IsString()
  name: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  requirements?: any; // Department requirements
}


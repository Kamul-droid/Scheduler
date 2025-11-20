import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class CreateEmployeeDto {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  skills?: any; // Array of Skill objects

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  availabilityPattern?: any; // AvailabilityPattern object

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: any; // Flexible metadata
}


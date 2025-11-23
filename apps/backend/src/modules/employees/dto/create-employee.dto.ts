import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsEmail, IsObject, IsOptional, IsString } from 'class-validator';
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
  @IsArray()
  skills?: any; // Array of Skill objects

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  availabilityPattern?: any; // AvailabilityPattern object

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: any; // Flexible metadata
}


import { Field, ID, InputType } from '@nestjs/graphql';
import { IsArray, IsDateString, IsInt, IsObject, IsOptional, IsUUID, Min } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class CreateShiftDto {
  @Field(() => ID)
  @IsUUID()
  departmentId: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsArray()
  requiredSkills?: any; // Array of Skill objects

  @Field()
  @IsInt()
  @Min(0)
  minStaffing: number;

  @Field()
  @IsInt()
  @Min(1)
  maxStaffing: number;

  @Field()
  @IsDateString()
  startTime: string;

  @Field()
  @IsDateString()
  endTime: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: any; // Flexible metadata
}


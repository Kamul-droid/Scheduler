import { Field, ID, InputType } from '@nestjs/graphql';
import { IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class OptimizationRequestDto {
  @Field()
  @IsDateString()
  startDate: string;

  @Field()
  @IsDateString()
  endDate: string;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  employeeIds?: string[];

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  departmentIds?: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  options?: {
    objective?: 'minimize_cost' | 'maximize_fairness' | 'balance';
    allowOvertime?: boolean;
    maxOptimizationTime?: number; // seconds
    solutionCount?: number; // number of solutions to return
  };
}


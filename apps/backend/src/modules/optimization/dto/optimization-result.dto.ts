import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

export enum OptimizationStatus {
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

registerEnumType(OptimizationStatus, {
  name: 'OptimizationStatus',
  description: 'Status of optimization request',
});

@ObjectType()
export class ScheduleAssignment {
  @Field(() => ID)
  employeeId: string;

  @Field(() => ID)
  shiftId: string;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;
}

@ObjectType()
export class OptimizationSolution {
  @Field()
  id: string;

  @Field()
  score: number;

  @Field(() => [ScheduleAssignment])
  assignments: ScheduleAssignment[];

  @Field(() => GraphQLJSON, { nullable: true })
  metrics?: {
    totalCost?: number;
    fairnessScore?: number;
    constraintViolations?: number;
    coverage?: number;
  };

  @Field()
  solveTime: number; // milliseconds
}

@ObjectType()
export class OptimizationResult {
  @Field()
  optimizationId: string;

  @Field(() => OptimizationStatus)
  status: OptimizationStatus;

  @Field(() => [OptimizationSolution])
  solutions: OptimizationSolution[];

  @Field()
  totalSolveTime: number; // milliseconds

  @Field({ nullable: true })
  message?: string;
}


import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OptimizationRequestDto } from './dto/optimization-request.dto';
import { OptimizationResult } from './dto/optimization-result.dto';
import { OptimizationService } from './optimization.service';

@Resolver(() => OptimizationResult)
export class OptimizationResolver {
  constructor(private readonly optimizationService: OptimizationService) {}

  @Mutation(() => OptimizationResult, { name: 'optimizeSchedule' })
  async optimize(
    @Args('optimizationRequest') optimizationRequest: OptimizationRequestDto,
  ) {
    return this.optimizationService.optimizeSchedule(optimizationRequest);
  }

  @Query(() => OptimizationResult, { name: 'optimizationStatus', nullable: true })
  async getStatus(@Args('optimizationId', { type: () => ID }) optimizationId: string) {
    return this.optimizationService.getOptimizationStatus(optimizationId);
  }
}


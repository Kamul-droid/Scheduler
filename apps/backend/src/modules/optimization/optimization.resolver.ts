import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OptimizationService } from './optimization.service';
// import { OptimizationRequest } from './dto/optimization-request.input';
// import { OptimizationResult } from './entities/optimization-result.entity';

@Resolver(() => Object)
export class OptimizationResolver {
  constructor(private readonly optimizationService: OptimizationService) {}

  @Mutation(() => Object, { name: 'optimizeSchedule' })
  async optimize(@Args('optimizationRequest') optimizationRequest: any) {
    return this.optimizationService.optimizeSchedule(optimizationRequest);
  }

  @Query(() => Object, { name: 'optimizationStatus' })
  async getStatus(@Args('optimizationId') optimizationId: string) {
    return this.optimizationService.getOptimizationStatus(optimizationId);
  }
}


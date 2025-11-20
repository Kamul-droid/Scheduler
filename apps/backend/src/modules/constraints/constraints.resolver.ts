import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ConstraintsService } from './constraints.service';
import { CreateConstraintDto } from './dto/create-constraint.dto';
import { UpdateConstraintDto } from './dto/update-constraint.dto';
import { Constraint } from './entities/constraint.entity';

@Resolver(() => Constraint)
export class ConstraintsResolver {
  constructor(private readonly constraintsService: ConstraintsService) {}

  @Query(() => [Constraint], { name: 'constraints' })
  findAll() {
    return this.constraintsService.findAll();
  }

  @Query(() => [Constraint], { name: 'activeConstraints' })
  getActiveConstraints() {
    return this.constraintsService.getActiveConstraints();
  }

  @Query(() => Constraint, { name: 'constraint', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.constraintsService.findOne(id);
  }

  @Mutation(() => Constraint)
  createConstraint(
    @Args('createConstraintInput') createConstraintInput: CreateConstraintDto,
  ) {
    return this.constraintsService.create(createConstraintInput);
  }

  @Mutation(() => Constraint)
  updateConstraint(
    @Args('updateConstraintInput') updateConstraintInput: UpdateConstraintDto & { id: string },
  ) {
    return this.constraintsService.update(
      updateConstraintInput.id,
      updateConstraintInput,
    );
  }

  @Mutation(() => Constraint, { nullable: true })
  removeConstraint(@Args('id', { type: () => ID }) id: string) {
    return this.constraintsService.remove(id);
  }
}


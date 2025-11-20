import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ConstraintsService } from './constraints.service';
// import { Constraint } from './entities/constraint.entity';
// import { CreateConstraintInput } from './dto/create-constraint.input';
// import { UpdateConstraintInput } from './dto/update-constraint.input';

@Resolver(() => Object) // TODO: Replace with Constraint entity
export class ConstraintsResolver {
  constructor(private readonly constraintsService: ConstraintsService) {}

  @Query(() => [Object], { name: 'constraints' })
  findAll() {
    return this.constraintsService.findAll();
  }

  @Query(() => [Object], { name: 'activeConstraints' })
  getActiveConstraints() {
    return this.constraintsService.getActiveConstraints();
  }

  @Query(() => Object, { name: 'constraint' })
  findOne(@Args('id') id: string) {
    return this.constraintsService.findOne(id);
  }

  @Mutation(() => Object)
  createConstraint(@Args('createConstraintInput') createConstraintInput: any) {
    return this.constraintsService.create(createConstraintInput);
  }

  @Mutation(() => Object)
  updateConstraint(@Args('updateConstraintInput') updateConstraintInput: any) {
    return this.constraintsService.update(
      updateConstraintInput.id,
      updateConstraintInput,
    );
  }

  @Mutation(() => Object)
  removeConstraint(@Args('id') id: string) {
    return this.constraintsService.remove(id);
  }
}


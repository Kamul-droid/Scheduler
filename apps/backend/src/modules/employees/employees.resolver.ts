import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { EmployeesService } from './employees.service';
// import { Employee } from './entities/employee.entity';
// import { CreateEmployeeInput } from './dto/create-employee.input';
// import { UpdateEmployeeInput } from './dto/update-employee.input';

@Resolver(() => Object) // TODO: Replace with Employee entity
export class EmployeesResolver {
  constructor(private readonly employeesService: EmployeesService) {}

  @Query(() => [Object], { name: 'employees' })
  findAll() {
    return this.employeesService.findAll();
  }

  @Query(() => Object, { name: 'employee' })
  findOne(@Args('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Mutation(() => Object)
  createEmployee(@Args('createEmployeeInput') createEmployeeInput: any) {
    return this.employeesService.create(createEmployeeInput);
  }

  @Mutation(() => Object)
  updateEmployee(@Args('updateEmployeeInput') updateEmployeeInput: any) {
    return this.employeesService.update(
      updateEmployeeInput.id,
      updateEmployeeInput,
    );
  }

  @Mutation(() => Object)
  removeEmployee(@Args('id') id: string) {
    return this.employeesService.remove(id);
  }
}


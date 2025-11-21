import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';

@Resolver(() => Employee)
export class EmployeesResolver {
  constructor(private readonly employeesService: EmployeesService) {}

  @Query(() => [Employee], { name: 'employees' })
  findAll() {
    return this.employeesService.findAll();
  }

  @Query(() => Employee, { name: 'employee', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.employeesService.findOne(id);
  }

  @Mutation(() => Employee)
  createEmployee(
    @Args('createEmployeeInput') createEmployeeInput: CreateEmployeeDto,
  ) {
    return this.employeesService.create(createEmployeeInput);
  }

  @Mutation(() => Employee)
  updateEmployee(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateEmployeeInput', { type: () => UpdateEmployeeDto }) updateEmployeeInput: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeInput);
  }

  @Mutation(() => Employee, { nullable: true })
  removeEmployee(@Args('id', { type: () => ID }) id: string) {
    return this.employeesService.remove(id);
  }
}


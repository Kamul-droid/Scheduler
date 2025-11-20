import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesResolver } from './employees.resolver';
import { EmployeesController } from './employees.controller';

@Module({
  providers: [EmployeesService, EmployeesResolver],
  controllers: [EmployeesController],
  exports: [EmployeesService],
})
export class EmployeesModule {}


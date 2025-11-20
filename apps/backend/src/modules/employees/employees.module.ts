import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { EmployeesService } from './employees.service';
import { EmployeesResolver } from './employees.resolver';
import { EmployeesController } from './employees.controller';

@Module({
  imports: [CommonModule],
  providers: [EmployeesService, EmployeesResolver],
  controllers: [EmployeesController],
  exports: [EmployeesService],
})
export class EmployeesModule {}


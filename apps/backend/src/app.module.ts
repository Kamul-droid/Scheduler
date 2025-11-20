import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { join } from 'path';
import { CommonModule } from './common/common.module';
import { ConstraintsModule } from './modules/constraints/constraints.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { OptimizationModule } from './modules/optimization/optimization.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { ShiftsModule } from './modules/shifts/shifts.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      introspection: process.env.NODE_ENV !== 'production',
      resolvers: { JSON: GraphQLJSON },
      // Apollo Server v5 uses Apollo Studio Explorer by default in development
    }),
    CommonModule,
    EmployeesModule,
    SchedulesModule,
    ConstraintsModule,
    OptimizationModule,
    DepartmentsModule,
    ShiftsModule,
  ],
})
export class AppModule {}

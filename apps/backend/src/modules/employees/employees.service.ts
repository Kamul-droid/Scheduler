import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly hasuraClient: HasuraClientService) {}

  /**
   * Transform Hasura response (snake_case) to Employee entity (camelCase)
   */
  private transformEmployee(employee: any): Employee {
    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      skills: employee.skills,
      availabilityPattern: employee.availability_pattern,
      metadata: employee.metadata,
      createdAt: employee.created_at ? new Date(employee.created_at) : new Date(),
      updatedAt: employee.updated_at ? new Date(employee.updated_at) : new Date(),
    };
  }

  async findAll(): Promise<Employee[]> {
    const query = `
      query GetEmployees {
        employees {
          id
          name
          email
          skills
          availability_pattern
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{ employees: any[] }>(
        query,
      );
      return (result.employees || []).map(emp => this.transformEmployee(emp));
    } catch (error) {
      this.logger.error(`Failed to fetch employees: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Employee> {
    const query = `
      query GetEmployee($id: uuid!) {
        employees_by_pk(id: $id) {
          id
          name
          email
          skills
          availability_pattern
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        employees_by_pk: Employee | null;
      }>(query, { id });

      if (!result.employees_by_pk) {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }

      return this.transformEmployee(result.employees_by_pk);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch employee ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const mutation = `
      mutation CreateEmployee($employee: employees_insert_input!) {
        insert_employees_one(object: $employee) {
          id
          name
          email
          skills
          availability_pattern
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        insert_employees_one: Employee;
      }>(mutation, {
        employee: {
          name: createEmployeeDto.name,
          email: createEmployeeDto.email,
          skills: createEmployeeDto.skills || null,
          availability_pattern: createEmployeeDto.availabilityPattern || null,
          metadata: createEmployeeDto.metadata || null,
        },
      });

      this.logger.log(`Created employee: ${result.insert_employees_one.id}`);
      return this.transformEmployee(result.insert_employees_one);
    } catch (error) {
      this.logger.error(`Failed to create employee: ${error.message}`);
      throw new BadRequestException(`Failed to create employee: ${error.message}`);
    }
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    // Check if employee exists
    await this.findOne(id);

    const mutation = `
      mutation UpdateEmployee($id: uuid!, $updates: employees_set_input!) {
        update_employees_by_pk(pk_columns: {id: $id}, _set: $updates) {
          id
          name
          email
          skills
          availability_pattern
          metadata
          created_at
          updated_at
        }
      }
    `;

    const updates: any = {};
    if (updateEmployeeDto.name !== undefined) updates.name = updateEmployeeDto.name;
    if (updateEmployeeDto.email !== undefined) updates.email = updateEmployeeDto.email;
    if (updateEmployeeDto.skills !== undefined) updates.skills = updateEmployeeDto.skills;
    if (updateEmployeeDto.availabilityPattern !== undefined)
      updates.availability_pattern = updateEmployeeDto.availabilityPattern;
    if (updateEmployeeDto.metadata !== undefined)
      updates.metadata = updateEmployeeDto.metadata;

    try {
      const result = await this.hasuraClient.execute<{
        update_employees_by_pk: Employee;
      }>(mutation, { id, updates });

      this.logger.log(`Updated employee: ${id}`);
      return this.transformEmployee(result.update_employees_by_pk);
    } catch (error) {
      this.logger.error(`Failed to update employee ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to update employee: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<Employee> {
    // First, try to get the employee to return it after deletion
    // If it doesn't exist, Hasura will return null and we'll handle it
    const getQuery = `
      query GetEmployee($id: uuid!) {
        employees_by_pk(id: $id) {
          id
          name
          email
          skills
          availability_pattern
          metadata
          created_at
          updated_at
        }
      }
    `;

    let employeeData: any = null;
    try {
      const getResult = await this.hasuraClient.execute<{
        employees_by_pk: any | null;
      }>(getQuery, { id });
      employeeData = getResult.employees_by_pk;
      
      if (!employeeData) {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.warn(`Could not fetch employee ${id} before deletion: ${error.message}`);
      // Continue with deletion attempt - Hasura will handle if it doesn't exist
    }

    const mutation = `
      mutation DeleteEmployee($id: uuid!) {
        delete_employees_by_pk(id: $id) {
          id
          name
          email
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        delete_employees_by_pk: any | null;
      }>(mutation, { id });

      if (!result.delete_employees_by_pk) {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }

      this.logger.log(`Deleted employee: ${id}`);
      // Return the transformed employee data if we have it, otherwise return the delete result
      return employeeData ? this.transformEmployee(employeeData) : result.delete_employees_by_pk;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete employee ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to delete employee: ${error.message}`,
      );
    }
  }
}


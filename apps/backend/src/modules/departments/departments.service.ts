import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private readonly hasuraClient: HasuraClientService) {}

  async findAll(): Promise<Department[]> {
    const query = `
      query GetDepartments {
        departments {
          id
          name
          requirements
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{ departments: any[] }>(
        query,
      );
      return (result.departments || []).map(this.mapToDepartment);
    } catch (error) {
      this.logger.error(`Failed to fetch departments: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Department> {
    const query = `
      query GetDepartment($id: uuid!) {
        departments_by_pk(id: $id) {
          id
          name
          requirements
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        departments_by_pk: any | null;
      }>(query, { id });

      if (!result.departments_by_pk) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      return this.mapToDepartment(result.departments_by_pk);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch department ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const mutation = `
      mutation CreateDepartment($department: departments_insert_input!) {
        insert_departments_one(object: $department) {
          id
          name
          requirements
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        insert_departments_one: any;
      }>(mutation, {
        department: {
          name: createDepartmentDto.name,
          requirements: createDepartmentDto.requirements || null,
        },
      });

      this.logger.log(`Created department: ${result.insert_departments_one.id}`);
      return this.mapToDepartment(result.insert_departments_one);
    } catch (error) {
      this.logger.error(`Failed to create department: ${error.message}`);
      throw new BadRequestException(
        `Failed to create department: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    // Check if department exists
    await this.findOne(id);

    const updates: any = {};
    if (updateDepartmentDto.name !== undefined)
      updates.name = updateDepartmentDto.name;
    if (updateDepartmentDto.requirements !== undefined)
      updates.requirements = updateDepartmentDto.requirements;

    const mutation = `
      mutation UpdateDepartment($id: uuid!, $updates: departments_set_input!) {
        update_departments_by_pk(pk_columns: {id: $id}, _set: $updates) {
          id
          name
          requirements
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        update_departments_by_pk: any;
      }>(mutation, { id, updates });

      this.logger.log(`Updated department: ${id}`);
      return this.mapToDepartment(result.update_departments_by_pk);
    } catch (error) {
      this.logger.error(`Failed to update department ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to update department: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<Department> {
    // Check if department exists
    await this.findOne(id);

    const mutation = `
      mutation DeleteDepartment($id: uuid!) {
        delete_departments_by_pk(id: $id) {
          id
          name
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        delete_departments_by_pk: any;
      }>(mutation, { id });

      this.logger.log(`Deleted department: ${id}`);
      return this.mapToDepartment(result.delete_departments_by_pk);
    } catch (error) {
      this.logger.error(`Failed to delete department ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to delete department: ${error.message}`,
      );
    }
  }

  /**
   * Maps database result to Department entity
   */
  private mapToDepartment(dbResult: any): Department {
    return {
      id: dbResult.id,
      name: dbResult.name,
      requirements: dbResult.requirements,
      createdAt: new Date(dbResult.created_at),
      updatedAt: new Date(dbResult.updated_at),
    };
  }
}


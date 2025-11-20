import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { Shift } from './entities/shift.entity';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(private readonly hasuraClient: HasuraClientService) {}

  async findAll(): Promise<Shift[]> {
    const query = `
      query GetShifts {
        shifts {
          id
          department_id
          required_skills
          min_staffing
          max_staffing
          start_time
          end_time
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{ shifts: any[] }>(
        query,
      );
      return (result.shifts || []).map(this.mapToShift);
    } catch (error) {
      this.logger.error(`Failed to fetch shifts: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Shift> {
    const query = `
      query GetShift($id: uuid!) {
        shifts_by_pk(id: $id) {
          id
          department_id
          required_skills
          min_staffing
          max_staffing
          start_time
          end_time
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        shifts_by_pk: any | null;
      }>(query, { id });

      if (!result.shifts_by_pk) {
        throw new NotFoundException(`Shift with ID ${id} not found`);
      }

      return this.mapToShift(result.shifts_by_pk);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch shift ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(createShiftDto: CreateShiftDto): Promise<Shift> {
    // Validate that end time is after start time
    const startTime = new Date(createShiftDto.startTime);
    const endTime = new Date(createShiftDto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate staffing levels
    if (createShiftDto.minStaffing > createShiftDto.maxStaffing) {
      throw new BadRequestException(
        'Min staffing cannot be greater than max staffing',
      );
    }

    const mutation = `
      mutation CreateShift($shift: shifts_insert_input!) {
        insert_shifts_one(object: $shift) {
          id
          department_id
          required_skills
          min_staffing
          max_staffing
          start_time
          end_time
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{ insert_shifts_one: any }>(
        mutation,
        {
          shift: {
            department_id: createShiftDto.departmentId,
            required_skills: createShiftDto.requiredSkills || null,
            min_staffing: createShiftDto.minStaffing,
            max_staffing: createShiftDto.maxStaffing,
            start_time: createShiftDto.startTime,
            end_time: createShiftDto.endTime,
            metadata: createShiftDto.metadata || null,
          },
        },
      );

      this.logger.log(`Created shift: ${result.insert_shifts_one.id}`);
      return this.mapToShift(result.insert_shifts_one);
    } catch (error) {
      this.logger.error(`Failed to create shift: ${error.message}`);
      throw new BadRequestException(`Failed to create shift: ${error.message}`);
    }
  }

  async update(id: string, updateShiftDto: UpdateShiftDto): Promise<Shift> {
    // Check if shift exists
    const currentShift = await this.findOne(id);

    // Validate time if both are provided
    if (updateShiftDto.startTime && updateShiftDto.endTime) {
      const startTime = new Date(updateShiftDto.startTime);
      const endTime = new Date(updateShiftDto.endTime);

      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    // Validate staffing levels if both are provided
    if (
      updateShiftDto.minStaffing !== undefined &&
      updateShiftDto.maxStaffing !== undefined
    ) {
      if (updateShiftDto.minStaffing > updateShiftDto.maxStaffing) {
        throw new BadRequestException(
          'Min staffing cannot be greater than max staffing',
        );
      }
    }

    const updates: any = {};
    if (updateShiftDto.departmentId !== undefined)
      updates.department_id = updateShiftDto.departmentId;
    if (updateShiftDto.requiredSkills !== undefined)
      updates.required_skills = updateShiftDto.requiredSkills;
    if (updateShiftDto.minStaffing !== undefined)
      updates.min_staffing = updateShiftDto.minStaffing;
    if (updateShiftDto.maxStaffing !== undefined)
      updates.max_staffing = updateShiftDto.maxStaffing;
    if (updateShiftDto.startTime !== undefined)
      updates.start_time = updateShiftDto.startTime;
    if (updateShiftDto.endTime !== undefined)
      updates.end_time = updateShiftDto.endTime;
    if (updateShiftDto.metadata !== undefined)
      updates.metadata = updateShiftDto.metadata;

    const mutation = `
      mutation UpdateShift($id: uuid!, $updates: shifts_set_input!) {
        update_shifts_by_pk(pk_columns: {id: $id}, _set: $updates) {
          id
          department_id
          required_skills
          min_staffing
          max_staffing
          start_time
          end_time
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{ update_shifts_by_pk: any }>(
        mutation,
        { id, updates },
      );

      this.logger.log(`Updated shift: ${id}`);
      return this.mapToShift(result.update_shifts_by_pk);
    } catch (error) {
      this.logger.error(`Failed to update shift ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update shift: ${error.message}`);
    }
  }

  async remove(id: string): Promise<Shift> {
    // Check if shift exists
    await this.findOne(id);

    const mutation = `
      mutation DeleteShift($id: uuid!) {
        delete_shifts_by_pk(id: $id) {
          id
          department_id
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{ delete_shifts_by_pk: any }>(
        mutation,
        { id },
      );

      this.logger.log(`Deleted shift: ${id}`);
      return this.mapToShift(result.delete_shifts_by_pk);
    } catch (error) {
      this.logger.error(`Failed to delete shift ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete shift: ${error.message}`);
    }
  }

  /**
   * Maps database result to Shift entity
   */
  private mapToShift(dbResult: any): Shift {
    return {
      id: dbResult.id,
      departmentId: dbResult.department_id,
      requiredSkills: dbResult.required_skills,
      minStaffing: dbResult.min_staffing,
      maxStaffing: dbResult.max_staffing,
      startTime: new Date(dbResult.start_time),
      endTime: new Date(dbResult.end_time),
      metadata: dbResult.metadata,
      createdAt: new Date(dbResult.created_at),
      updatedAt: new Date(dbResult.updated_at),
    };
  }
}


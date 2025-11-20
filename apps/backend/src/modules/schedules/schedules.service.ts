import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { ScheduleStatus } from '../../common/types/schedule-status.enum';
import { ConflictDetectionService } from './conflict-detection.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { ValidationService } from './validation.service';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private readonly hasuraClient: HasuraClientService,
    private readonly conflictDetectionService: ConflictDetectionService,
    private readonly validationService: ValidationService,
  ) {}

  async findAll(): Promise<Schedule[]> {
    const query = `
      query GetSchedules {
        schedules {
          id
          employee_id
          shift_id
          start_time
          end_time
          status
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{ schedules: any[] }>(
        query,
      );
      return (result.schedules || []).map(this.mapToSchedule);
    } catch (error) {
      this.logger.error(`Failed to fetch schedules: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Schedule> {
    const query = `
      query GetSchedule($id: uuid!) {
        schedules_by_pk(id: $id) {
          id
          employee_id
          shift_id
          start_time
          end_time
          status
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        schedules_by_pk: any | null;
      }>(query, { id });

      if (!result.schedules_by_pk) {
        throw new NotFoundException(`Schedule with ID ${id} not found`);
      }

      return this.mapToSchedule(result.schedules_by_pk);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch schedule ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    // Validate constraints before creating
    await this.validationService.validateSchedule(createScheduleDto);

    // Check for conflicts
    const conflicts = await this.conflictDetectionService.detectConflicts(
      createScheduleDto,
    );

    // Determine status based on conflicts
    let status = createScheduleDto.status || ScheduleStatus.CONFIRMED;
    if (conflicts.some((c) => c.severity === 'error')) {
      status = ScheduleStatus.CONFLICT;
      throw new ConflictException(
        `Schedule conflicts detected: ${conflicts.map((c) => c.message).join('; ')}`,
      );
    } else if (conflicts.length > 0) {
      status = ScheduleStatus.TENTATIVE;
    }

    const mutation = `
      mutation CreateSchedule($schedule: schedules_insert_input!) {
        insert_schedules_one(object: $schedule) {
          id
          employee_id
          shift_id
          start_time
          end_time
          status
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        insert_schedules_one: any;
      }>(mutation, {
        schedule: {
          employee_id: createScheduleDto.employeeId,
          shift_id: createScheduleDto.shiftId,
          start_time: createScheduleDto.startTime,
          end_time: createScheduleDto.endTime,
          status: status,
          metadata: createScheduleDto.metadata || null,
        },
      });

      this.logger.log(`Created schedule: ${result.insert_schedules_one.id}`);
      return this.mapToSchedule(result.insert_schedules_one);
    } catch (error) {
      this.logger.error(`Failed to create schedule: ${error.message}`);
      throw new BadRequestException(
        `Failed to create schedule: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    // Check if schedule exists
    await this.findOne(id);

    // Build update object
    const updateData: any = {};
    if (updateScheduleDto.employeeId !== undefined)
      updateData.employee_id = updateScheduleDto.employeeId;
    if (updateScheduleDto.shiftId !== undefined)
      updateData.shift_id = updateScheduleDto.shiftId;
    if (updateScheduleDto.startTime !== undefined)
      updateData.start_time = updateScheduleDto.startTime;
    if (updateScheduleDto.endTime !== undefined)
      updateData.end_time = updateScheduleDto.endTime;
    if (updateScheduleDto.status !== undefined)
      updateData.status = updateScheduleDto.status;
    if (updateScheduleDto.metadata !== undefined)
      updateData.metadata = updateScheduleDto.metadata;

    // If time or employee changed, validate and check conflicts
    if (
      updateScheduleDto.startTime ||
      updateScheduleDto.endTime ||
      updateScheduleDto.employeeId
    ) {
      const currentSchedule = await this.findOne(id);
      const scheduleToValidate: CreateScheduleDto = {
        employeeId:
          updateScheduleDto.employeeId || currentSchedule.employeeId,
        shiftId: updateScheduleDto.shiftId || currentSchedule.shiftId,
        startTime:
          updateScheduleDto.startTime ||
          currentSchedule.startTime.toISOString(),
        endTime:
          updateScheduleDto.endTime || currentSchedule.endTime.toISOString(),
      };

      await this.validationService.validateSchedule(scheduleToValidate);
      const conflicts = await this.conflictDetectionService.detectConflicts(
        scheduleToValidate,
        id,
      );

      if (conflicts.some((c) => c.severity === 'error')) {
        throw new ConflictException(
          `Schedule conflicts detected: ${conflicts.map((c) => c.message).join('; ')}`,
        );
      }
    }

    const mutation = `
      mutation UpdateSchedule($id: uuid!, $updates: schedules_set_input!) {
        update_schedules_by_pk(pk_columns: {id: $id}, _set: $updates) {
          id
          employee_id
          shift_id
          start_time
          end_time
          status
          metadata
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        update_schedules_by_pk: any;
      }>(mutation, { id, updates: updateData });

      this.logger.log(`Updated schedule: ${id}`);
      return this.mapToSchedule(result.update_schedules_by_pk);
    } catch (error) {
      this.logger.error(`Failed to update schedule ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to update schedule: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<Schedule> {
    // Check if schedule exists
    await this.findOne(id);

    const mutation = `
      mutation DeleteSchedule($id: uuid!) {
        delete_schedules_by_pk(id: $id) {
          id
          employee_id
          shift_id
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        delete_schedules_by_pk: any;
      }>(mutation, { id });

      this.logger.log(`Deleted schedule: ${id}`);
      return this.mapToSchedule(result.delete_schedules_by_pk);
    } catch (error) {
      this.logger.error(`Failed to delete schedule ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to delete schedule: ${error.message}`,
      );
    }
  }

  /**
   * Maps database result to Schedule entity
   */
  private mapToSchedule(dbResult: any): Schedule {
    return {
      id: dbResult.id,
      employeeId: dbResult.employee_id,
      shiftId: dbResult.shift_id,
      startTime: dbResult.start_time instanceof Date 
        ? dbResult.start_time 
        : new Date(dbResult.start_time),
      endTime: dbResult.end_time instanceof Date 
        ? dbResult.end_time 
        : new Date(dbResult.end_time),
      status: dbResult.status as ScheduleStatus,
      metadata: dbResult.metadata,
      createdAt: dbResult.created_at instanceof Date 
        ? dbResult.created_at 
        : new Date(dbResult.created_at),
      updatedAt: dbResult.updated_at instanceof Date 
        ? dbResult.updated_at 
        : new Date(dbResult.updated_at),
    };
  }
}


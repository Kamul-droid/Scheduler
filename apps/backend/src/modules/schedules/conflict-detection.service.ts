import { Injectable, Logger } from '@nestjs/common';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ScheduleConflict } from './dto/schedule-conflict.dto';

@Injectable()
export class ConflictDetectionService {
  private readonly logger = new Logger(ConflictDetectionService.name);

  constructor(private readonly hasuraClient: HasuraClientService) {}

  /**
   * Detects conflicts in schedule assignments
   * Checks for:
   * - Double-bookings (same employee, overlapping times)
   * - Constraint violations
   * - Skill mismatches
   */
  async detectConflicts(
    schedule: CreateScheduleDto,
    excludeScheduleId?: string,
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    // Check for overlapping schedules for the same employee
    const overlapConflicts = await this.detectOverlaps(
      schedule,
      excludeScheduleId,
    );
    conflicts.push(...overlapConflicts);

    // Check skill requirements
    const skillConflicts = await this.validateSkills(schedule);
    conflicts.push(...skillConflicts);

    return conflicts;
  }

  /**
   * Detects overlapping schedules for the same employee
   */
  private async detectOverlaps(
    schedule: CreateScheduleDto,
    excludeScheduleId?: string,
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    const query = `
      query CheckOverlaps($employeeId: uuid!, $startTime: timestamptz!, $endTime: timestamptz!, $excludeId: uuid) {
        schedules(
          where: {
            employee_id: { _eq: $employeeId }
            _or: [
              {
                _and: [
                  { start_time: { _lt: $endTime } }
                  { end_time: { _gt: $startTime } }
                ]
              }
            ]
            ${excludeScheduleId ? 'id: { _neq: $excludeId }' : ''}
          }
        ) {
          id
          start_time
          end_time
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        schedules: Array<{ id: string; start_time: string; end_time: string }>;
      }>(query, {
        employeeId: schedule.employeeId,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        excludeId: excludeScheduleId,
      });

      for (const overlappingSchedule of result.schedules || []) {
        conflicts.push({
          scheduleId: schedule.employeeId,
          conflictingScheduleId: overlappingSchedule.id,
          message: `Employee is already scheduled during this time period (${overlappingSchedule.start_time} - ${overlappingSchedule.end_time})`,
          severity: 'error',
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to check for overlaps: ${error.message}`,
        error.stack,
      );
    }

    return conflicts;
  }

  /**
   * Validates skill requirements for a schedule
   */
  private async validateSkills(
    schedule: CreateScheduleDto,
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    // Get shift requirements
    const shiftQuery = `
      query GetShift($shiftId: uuid!) {
        shifts_by_pk(id: $shiftId) {
          required_skills
        }
      }
    `;

    // Get employee skills
    const employeeQuery = `
      query GetEmployee($employeeId: uuid!) {
        employees_by_pk(id: $employeeId) {
          skills
        }
      }
    `;

    try {
      const [shiftResult, employeeResult] = await Promise.all([
        this.hasuraClient.execute<{
          shifts_by_pk: { required_skills?: any };
        }>(shiftQuery, { shiftId: schedule.shiftId }),
        this.hasuraClient.execute<{
          employees_by_pk: { skills?: any };
        }>(employeeQuery, { employeeId: schedule.employeeId }),
      ]);

      const requiredSkills = shiftResult.shifts_by_pk?.required_skills;
      const employeeSkills = employeeResult.employees_by_pk?.skills;

      if (requiredSkills && Array.isArray(requiredSkills)) {
        const employeeSkillNames = Array.isArray(employeeSkills)
          ? employeeSkills.map((s: any) => s.name || s)
          : [];

        const missingSkills = requiredSkills.filter(
          (reqSkill: string) => !employeeSkillNames.includes(reqSkill),
        );

        if (missingSkills.length > 0) {
          conflicts.push({
            scheduleId: schedule.employeeId,
            conflictingScheduleId: schedule.shiftId,
            message: `Employee lacks required skills: ${missingSkills.join(', ')}`,
            severity: 'error',
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to validate skills: ${error.message}`,
        error.stack,
      );
    }

    return conflicts;
  }

  /**
   * Checks if two schedules overlap in time
   */
  schedulesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return start1 < end2 && start2 < end1;
  }
}


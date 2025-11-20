import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { ConstraintType } from '../../common/types/constraint-type.enum';
import { CreateScheduleDto } from '../schedules/dto/create-schedule.dto';

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  constructor(private readonly hasuraClient: HasuraClientService) {}

  /**
   * Validates the structure of constraint rules
   */
  validateRuleStructure(rules: any, constraintType: ConstraintType): void {
    if (!rules || typeof rules !== 'object') {
      throw new BadRequestException('Rules must be a valid object');
    }

    switch (constraintType) {
      case ConstraintType.MAX_HOURS:
        if (typeof rules.maxHours !== 'number' || rules.maxHours <= 0) {
          throw new BadRequestException(
            'max_hours constraint requires a positive maxHours value',
          );
        }
        if (
          rules.periodInDays &&
          (typeof rules.periodInDays !== 'number' || rules.periodInDays <= 0)
        ) {
          throw new BadRequestException(
            'max_hours constraint periodInDays must be a positive number',
          );
        }
        break;

      case ConstraintType.MIN_REST:
        if (typeof rules.minRestHours !== 'number' || rules.minRestHours < 0) {
          throw new BadRequestException(
            'min_rest constraint requires a non-negative minRestHours value',
          );
        }
        break;

      case ConstraintType.SKILL_REQUIREMENT:
        if (!Array.isArray(rules.requiredSkills)) {
          throw new BadRequestException(
            'skill_requirement constraint requires an array of requiredSkills',
          );
        }
        break;

      case ConstraintType.AVAILABILITY:
        if (!Array.isArray(rules.availabilityWindows)) {
          throw new BadRequestException(
            'availability constraint requires an array of availabilityWindows',
          );
        }
        break;

      case ConstraintType.FAIR_DISTRIBUTION:
        if (typeof rules.maxShiftsPerEmployee !== 'number') {
          throw new BadRequestException(
            'fair_distribution constraint requires maxShiftsPerEmployee',
          );
        }
        break;

      case ConstraintType.MAX_CONSECUTIVE_DAYS:
        if (typeof rules.maxDays !== 'number' || rules.maxDays <= 0) {
          throw new BadRequestException(
            'max_consecutive_days constraint requires a positive maxDays value',
          );
        }
        break;

      case ConstraintType.MIN_CONSECUTIVE_DAYS:
        if (typeof rules.minDays !== 'number' || rules.minDays <= 0) {
          throw new BadRequestException(
            'min_consecutive_days constraint requires a positive minDays value',
          );
        }
        break;

      default:
        this.logger.warn(`Unknown constraint type: ${constraintType}`);
    }
  }

  /**
   * Evaluates a constraint rule against a schedule
   */
  async evaluateRule(
    constraint: { type: ConstraintType; rules: any },
    schedule: CreateScheduleDto,
  ): Promise<boolean> {
    switch (constraint.type) {
      case ConstraintType.MAX_HOURS:
        return await this.evaluateMaxHours(constraint.rules, schedule);

      case ConstraintType.MIN_REST:
        return await this.evaluateMinRest(constraint.rules, schedule);

      case ConstraintType.SKILL_REQUIREMENT:
        return await this.evaluateSkillMatching(constraint.rules, schedule);

      case ConstraintType.AVAILABILITY:
        return await this.evaluateAvailability(constraint.rules, schedule);

      case ConstraintType.FAIR_DISTRIBUTION:
        return await this.evaluateFairDistribution(constraint.rules, schedule);

      case ConstraintType.MAX_CONSECUTIVE_DAYS:
        return await this.evaluateMaxConsecutiveDays(constraint.rules, schedule);

      case ConstraintType.MIN_CONSECUTIVE_DAYS:
        return await this.evaluateMinConsecutiveDays(constraint.rules, schedule);

      default:
        this.logger.warn(`Unknown constraint type: ${constraint.type}`);
        return true;
    }
  }

  /**
   * Applies all active constraints to a schedule
   */
  async applyConstraints(
    schedule: CreateScheduleDto,
    constraints: Array<{ type: ConstraintType; rules: any }>,
  ): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = [];

    for (const constraint of constraints) {
      try {
        const isValid = await this.evaluateRule(constraint, schedule);
        if (!isValid) {
          violations.push(
            `Constraint violation: ${constraint.type} - ${JSON.stringify(constraint.rules)}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error evaluating constraint ${constraint.type}: ${error.message}`,
        );
        violations.push(`Error evaluating constraint: ${constraint.type}`);
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Evaluates max hours constraint
   */
  private async evaluateMaxHours(
    rules: { maxHours: number; periodInDays?: number },
    schedule: CreateScheduleDto,
  ): Promise<boolean> {
    const periodInDays = rules.periodInDays || 7; // Default to weekly
    const periodStart = new Date(schedule.startTime);
    periodStart.setDate(periodStart.getDate() - periodInDays);

    // Get all schedules for this employee in the period
    const query = `
      query GetEmployeeSchedules($employeeId: uuid!, $startTime: timestamptz!) {
        schedules(
          where: {
            employee_id: { _eq: $employeeId }
            start_time: { _gte: $startTime }
          }
        ) {
          start_time
          end_time
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        schedules: Array<{ start_time: string; end_time: string }>;
      }>(query, {
        employeeId: schedule.employeeId,
        startTime: periodStart.toISOString(),
      });

      // Calculate total hours
      let totalHours = 0;
      for (const s of result.schedules || []) {
        const start = new Date(s.start_time);
        const end = new Date(s.end_time);
        totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }

      // Add current schedule hours
      const scheduleStart = new Date(schedule.startTime);
      const scheduleEnd = new Date(schedule.endTime);
      const scheduleHours =
        (scheduleEnd.getTime() - scheduleStart.getTime()) / (1000 * 60 * 60);
      totalHours += scheduleHours;

      return totalHours <= rules.maxHours;
    } catch (error) {
      this.logger.error(`Error evaluating max hours: ${error.message}`);
      return false;
    }
  }

  /**
   * Evaluates minimum rest constraint
   */
  private async evaluateMinRest(
    rules: { minRestHours: number },
    schedule: CreateScheduleDto,
  ): Promise<boolean> {
    // Get previous schedule for this employee
    const query = `
      query GetPreviousSchedule($employeeId: uuid!, $startTime: timestamptz!) {
        schedules(
          where: {
            employee_id: { _eq: $employeeId }
            end_time: { _lt: $startTime }
          }
          order_by: { end_time: desc }
          limit: 1
        ) {
          end_time
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        schedules: Array<{ end_time: string }>;
      }>(query, {
        employeeId: schedule.employeeId,
        startTime: schedule.startTime,
      });

      if (result.schedules.length === 0) {
        return true; // No previous schedule, constraint satisfied
      }

      const previousEnd = new Date(result.schedules[0].end_time);
      const currentStart = new Date(schedule.startTime);
      const restHours =
        (currentStart.getTime() - previousEnd.getTime()) / (1000 * 60 * 60);

      return restHours >= rules.minRestHours;
    } catch (error) {
      this.logger.error(`Error evaluating min rest: ${error.message}`);
      return false;
    }
  }

  /**
   * Evaluates skill matching constraint
   */
  private async evaluateSkillMatching(
    rules: { requiredSkills: string[] },
    schedule: CreateScheduleDto,
  ): Promise<boolean> {
    // Get shift required skills
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

      const requiredSkills = rules.requiredSkills || [];
      const employeeSkills = employeeResult.employees_by_pk?.skills || [];
      const employeeSkillNames = Array.isArray(employeeSkills)
        ? employeeSkills.map((s: any) => s.name || s)
        : [];

      return requiredSkills.every((skill) => employeeSkillNames.includes(skill));
    } catch (error) {
      this.logger.error(`Error evaluating skill matching: ${error.message}`);
      return false;
    }
  }

  /**
   * Evaluates availability constraint
   */
  private async evaluateAvailability(
    rules: { availabilityWindows: any[] },
    schedule: CreateScheduleDto,
  ): Promise<boolean> {
    const scheduleStart = new Date(schedule.startTime);
    const dayOfWeek = scheduleStart.getDay(); // 0 = Sunday, 6 = Saturday
    const scheduleTime = scheduleStart.toTimeString().substring(0, 5); // HH:MM

    const availableWindow = rules.availabilityWindows.find(
      (window) => window.dayOfWeek === dayOfWeek,
    );

    if (!availableWindow) {
      return false; // No availability for this day
    }

    return (
      scheduleTime >= availableWindow.startTime &&
      scheduleTime <= availableWindow.endTime
    );
  }

  /**
   * Evaluates fair distribution constraint
   */
  private async evaluateFairDistribution(
    rules: { maxShiftsPerEmployee: number },
    schedule: CreateScheduleDto,
  ): Promise<boolean> {
    // This would typically check shifts in a period
    // For simplicity, we'll check if employee has too many shifts
    const query = `
      query CountEmployeeShifts($employeeId: uuid!) {
        schedules_aggregate(where: { employee_id: { _eq: $employeeId } }) {
          aggregate {
            count
          }
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        schedules_aggregate: { aggregate: { count: number } };
      }>(query, { employeeId: schedule.employeeId });

      const currentCount = result.schedules_aggregate?.aggregate?.count || 0;
      return currentCount < rules.maxShiftsPerEmployee;
    } catch (error) {
      this.logger.error(
        `Error evaluating fair distribution: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Evaluates max consecutive days constraint
   */
  private async evaluateMaxConsecutiveDays(
    rules: { maxDays: number },
    schedule: CreateScheduleDto,
  ): Promise<boolean> {
    // Get consecutive schedules for this employee
    const scheduleDate = new Date(schedule.startTime);
    const startDate = new Date(scheduleDate);
    startDate.setDate(startDate.getDate() - rules.maxDays);

    const query = `
      query GetConsecutiveSchedules($employeeId: uuid!, $startDate: timestamptz!) {
        schedules(
          where: {
            employee_id: { _eq: $employeeId }
            start_time: { _gte: $startDate }
          }
          order_by: { start_time: asc }
        ) {
          start_time
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        schedules: Array<{ start_time: string }>;
      }>(query, {
        employeeId: schedule.employeeId,
        startDate: startDate.toISOString(),
      });

      // Count consecutive days
      let consecutiveDays = 1;
      const scheduleDates = new Set(
        (result.schedules || []).map((s) =>
          new Date(s.start_time).toDateString(),
        ),
      );
      scheduleDates.add(scheduleDate.toDateString());

      return scheduleDates.size <= rules.maxDays;
    } catch (error) {
      this.logger.error(
        `Error evaluating max consecutive days: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Evaluates min consecutive days constraint
   */
  private async evaluateMinConsecutiveDays(
    rules: { minDays: number },
    schedule: CreateScheduleDto,
  ): Promise<boolean> {
    // This constraint is typically checked when removing schedules
    // For creation, we assume it's valid if it doesn't break existing patterns
    return true;
  }
}


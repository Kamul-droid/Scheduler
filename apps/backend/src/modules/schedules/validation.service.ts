import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { RuleEngineService } from '../constraints/rule-engine.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    private readonly hasuraClient: HasuraClientService,
    private readonly ruleEngine: RuleEngineService,
  ) {}

  /**
   * Validates a schedule against all active constraints
   */
  async validateSchedule(schedule: CreateScheduleDto): Promise<void> {
    // Get all active constraints
    const constraints = await this.getActiveConstraints();

    // Validate against each constraint
    const violations: string[] = [];

    for (const constraint of constraints) {
      const result = await this.ruleEngine.applyConstraints(
        schedule,
        [constraint],
      );

      if (!result.valid) {
        violations.push(...result.violations);
      }
    }

    if (violations.length > 0) {
      throw new BadRequestException(
        `Schedule validation failed: ${violations.join('; ')}`,
      );
    }
  }

  /**
   * Validates schedule against specific constraint type
   */
  async validateConstraint(
    schedule: CreateScheduleDto,
    constraint: any,
  ): Promise<boolean> {
    const result = await this.ruleEngine.applyConstraints(schedule, [constraint]);
    return result.valid;
  }

  /**
   * Gets all active constraints from database
   */
  private async getActiveConstraints(): Promise<any[]> {
    const query = `
      query GetActiveConstraints {
        constraints(where: { active: { _eq: true } }) {
          id
          type
          rules
          priority
          active
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        constraints: any[];
      }>(query);
      return result.constraints || [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch active constraints: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}


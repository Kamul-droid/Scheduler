import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { ConstraintType } from '../../common/types/constraint-type.enum';
import { CreateConstraintDto } from './dto/create-constraint.dto';
import { UpdateConstraintDto } from './dto/update-constraint.dto';
import { Constraint } from './entities/constraint.entity';
import { RuleEngineService } from './rule-engine.service';

@Injectable()
export class ConstraintsService {
  private readonly logger = new Logger(ConstraintsService.name);

  constructor(
    private readonly hasuraClient: HasuraClientService,
    private readonly ruleEngineService: RuleEngineService,
  ) {}

  async findAll(): Promise<Constraint[]> {
    const query = `
      query GetConstraints {
        constraints {
          id
          type
          rules
          priority
          active
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{ constraints: any[] }>(
        query,
      );
      return (result.constraints || []).map(this.mapToConstraint);
    } catch (error) {
      this.logger.error(`Failed to fetch constraints: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Constraint> {
    const query = `
      query GetConstraint($id: uuid!) {
        constraints_by_pk(id: $id) {
          id
          type
          rules
          priority
          active
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        constraints_by_pk: any | null;
      }>(query, { id });

      if (!result.constraints_by_pk) {
        throw new NotFoundException(`Constraint with ID ${id} not found`);
      }

      return this.mapToConstraint(result.constraints_by_pk);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch constraint ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(createConstraintDto: CreateConstraintDto): Promise<Constraint> {
    // Validate constraint rules before creating
    this.ruleEngineService.validateRuleStructure(
      createConstraintDto.rules,
      createConstraintDto.type,
    );

    const mutation = `
      mutation CreateConstraint($constraint: constraints_insert_input!) {
        insert_constraints_one(object: $constraint) {
          id
          type
          rules
          priority
          active
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        insert_constraints_one: any;
      }>(mutation, {
        constraint: {
          type: createConstraintDto.type,
          rules: createConstraintDto.rules,
          priority: createConstraintDto.priority,
          active: createConstraintDto.active !== undefined ? createConstraintDto.active : true,
        },
      });

      this.logger.log(`Created constraint: ${result.insert_constraints_one.id}`);
      return this.mapToConstraint(result.insert_constraints_one);
    } catch (error) {
      this.logger.error(`Failed to create constraint: ${error.message}`);
      throw new BadRequestException(
        `Failed to create constraint: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateConstraintDto: UpdateConstraintDto,
  ): Promise<Constraint> {
    // Check if constraint exists
    await this.findOne(id);

    // Validate rules if provided
    if (updateConstraintDto.rules) {
      const currentConstraint = await this.findOne(id);
      this.ruleEngineService.validateRuleStructure(
        updateConstraintDto.rules,
        updateConstraintDto.type || currentConstraint.type,
      );
    }

    const updates: any = {};
    if (updateConstraintDto.type !== undefined)
      updates.type = updateConstraintDto.type;
    if (updateConstraintDto.rules !== undefined)
      updates.rules = updateConstraintDto.rules;
    if (updateConstraintDto.priority !== undefined)
      updates.priority = updateConstraintDto.priority;
    if (updateConstraintDto.active !== undefined)
      updates.active = updateConstraintDto.active;

    const mutation = `
      mutation UpdateConstraint($id: uuid!, $updates: constraints_set_input!) {
        update_constraints_by_pk(pk_columns: {id: $id}, _set: $updates) {
          id
          type
          rules
          priority
          active
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        update_constraints_by_pk: any;
      }>(mutation, { id, updates });

      this.logger.log(`Updated constraint: ${id}`);
      return this.mapToConstraint(result.update_constraints_by_pk);
    } catch (error) {
      this.logger.error(`Failed to update constraint ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to update constraint: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<Constraint> {
    // Check if constraint exists
    await this.findOne(id);

    const mutation = `
      mutation DeleteConstraint($id: uuid!) {
        delete_constraints_by_pk(id: $id) {
          id
          type
          priority
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{
        delete_constraints_by_pk: any;
      }>(mutation, { id });

      this.logger.log(`Deleted constraint: ${id}`);
      return this.mapToConstraint(result.delete_constraints_by_pk);
    } catch (error) {
      this.logger.error(`Failed to delete constraint ${id}: ${error.message}`);
      throw new BadRequestException(
        `Failed to delete constraint: ${error.message}`,
      );
    }
  }

  async getActiveConstraints(): Promise<Constraint[]> {
    const query = `
      query GetActiveConstraints {
        constraints(where: { active: { _eq: true } }, order_by: { priority: desc }) {
          id
          type
          rules
          priority
          active
          created_at
          updated_at
        }
      }
    `;

    try {
      const result = await this.hasuraClient.execute<{ constraints: any[] }>(
        query,
      );
      return (result.constraints || []).map(this.mapToConstraint);
    } catch (error) {
      this.logger.error(
        `Failed to fetch active constraints: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Maps database result to Constraint entity
   */
  private mapToConstraint(dbResult: any): Constraint {
    return {
      id: dbResult.id,
      type: dbResult.type as ConstraintType,
      rules: dbResult.rules,
      priority: dbResult.priority,
      active: dbResult.active,
      createdAt: new Date(dbResult.created_at),
      updatedAt: new Date(dbResult.updated_at),
    };
  }
}


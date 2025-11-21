import { Injectable, Logger } from '@nestjs/common';
import { HasuraClientService } from '../../common/services/hasura-client.service';
import { OptimizationRequestDto } from './dto/optimization-request.dto';
import { OptimizationResult, OptimizationStatus } from './dto/optimization-result.dto';
import { OptimizationClient } from './optimization-client.service';

@Injectable()
export class OptimizationOrchestrator {
  private readonly logger = new Logger(OptimizationOrchestrator.name);
  private readonly optimizationResults = new Map<
    string,
    OptimizationResult
  >();

  constructor(
    private readonly optimizationClient: OptimizationClient,
    private readonly hasuraClient: HasuraClientService,
  ) {}

  /**
   * Orchestrates the optimization process:
   * 1. Collects current state (employees, shifts, constraints)
   * 2. Calls Python optimization service
   * 3. Validates solutions
   * 4. Returns solution candidates
   */
  async optimize(
    optimizationRequest: OptimizationRequestDto,
  ): Promise<OptimizationResult> {
    const optimizationId = this.generateOptimizationId();

    try {
      // Step 1: Collect current state
      const currentState = await this.collectCurrentState(optimizationRequest);

      // Step 2: Call Python optimization service
      const optimizationResponse = await this.optimizationClient.requestOptimization(
        currentState,
      );

      // Step 3: Validate solutions
      const validatedSolutions = await this.validateSolutions(
        optimizationResponse.solutions || [],
      );

      // Step 4: Create result
      const finalOptimizationId = optimizationResponse.optimizationId || optimizationId;
      const result: OptimizationResult = {
        optimizationId: finalOptimizationId,
        status:
          optimizationResponse.status === 'completed'
            ? OptimizationStatus.COMPLETED
            : optimizationResponse.status === 'partial'
              ? OptimizationStatus.PARTIAL
              : OptimizationStatus.FAILED,
        solutions: validatedSolutions,
        totalSolveTime: optimizationResponse.totalSolveTime || 0,
        message:
          optimizationResponse.message ||
          `Generated ${validatedSolutions.length} valid solutions`,
      };

      // Store result using the final optimization ID (from response or generated)
      this.optimizationResults.set(finalOptimizationId, result);

      return result;
    } catch (error) {
      this.logger.error(
        `Optimization failed: ${error.message}`,
        error.stack,
      );

      const result: OptimizationResult = {
        optimizationId,
        status: OptimizationStatus.FAILED,
        solutions: [],
        totalSolveTime: 0,
        message: `Optimization failed: ${error.message}`,
      };

      this.optimizationResults.set(optimizationId, result);
      return result;
    }
  }

  /**
   * Collects current state from database
   */
  private async collectCurrentState(
    request: OptimizationRequestDto,
  ): Promise<any> {
    const state: any = {
      employees: [],
      shifts: [],
      constraints: [],
      startDate: request.startDate,
      endDate: request.endDate,
      options: request.options || {},
    };

    try {
      // Collect employees
      if (request.employeeIds && request.employeeIds.length > 0) {
        const employeeQuery = `
          query GetEmployees($ids: [uuid!]!) {
            employees(where: { id: { _in: $ids } }) {
              id
              name
              email
              skills
              availability_pattern
              metadata
            }
          }
        `;
        const employeeResult = await this.hasuraClient.execute<{
          employees: any[];
        }>(employeeQuery, { ids: request.employeeIds });
        state.employees = employeeResult.employees || [];
      } else {
        const allEmployeesQuery = `
          query GetAllEmployees {
            employees {
              id
              name
              email
              skills
              availability_pattern
              metadata
            }
          }
        `;
        const allEmployeesResult = await this.hasuraClient.execute<{
          employees: any[];
        }>(allEmployeesQuery);
        state.employees = allEmployeesResult.employees || [];
      }

      // Collect shifts (filter by date range if needed)
      const shiftQuery = `
        query GetShifts($startDate: timestamptz!, $endDate: timestamptz!) {
          shifts(
            where: {
              start_time: { _lte: $endDate }
              end_time: { _gte: $startDate }
            }
          ) {
            id
            department_id
            required_skills
            min_staffing
            max_staffing
            start_time
            end_time
            metadata
          }
        }
      `;
      const shiftResult = await this.hasuraClient.execute<{ shifts: any[] }>(
        shiftQuery,
        { startDate: request.startDate, endDate: request.endDate },
      );
      state.shifts = shiftResult.shifts || [];

      // Collect active constraints
      const constraintsQuery = `
        query GetActiveConstraints {
          constraints(where: { active: { _eq: true } }, order_by: { priority: desc }) {
            id
            type
            rules
            priority
          }
        }
      `;
      const constraintsResult = await this.hasuraClient.execute<{
        constraints: any[];
      }>(constraintsQuery);
      state.constraints = constraintsResult.constraints || [];

      // Fetch current schedules in date range
      const schedulesQuery = `
        query GetSchedules($startDate: timestamptz!, $endDate: timestamptz!) {
          schedules(
            where: {
              start_time: { _lte: $endDate }
              end_time: { _gte: $startDate }
            }
          ) {
            id
            employee_id
            shift_id
            start_time
            end_time
            status
          }
        }
      `;
      const schedulesResult = await this.hasuraClient.execute<{
        schedules: any[];
      }>(schedulesQuery, {
        startDate: request.startDate,
        endDate: request.endDate,
      });
      state.currentSchedules = schedulesResult.schedules || [];
    } catch (error) {
      this.logger.error(
        `Failed to collect current state: ${error.message}`,
        error.stack,
      );
      throw error;
    }

    return state;
  }

  /**
   * Validates optimization solutions
   */
  private async validateSolutions(solutions: any[]): Promise<any[]> {
    // Basic validation - check that solutions have required structure
    if (!Array.isArray(solutions)) {
      return [];
    }

    return solutions
      .filter((solution) => {
        return (
          solution &&
          typeof solution === 'object' &&
          Array.isArray(solution.assignments) &&
          typeof solution.score === 'number'
        );
      })
      .map((solution) => ({
        id: solution.id || `solution_${Date.now()}`,
        score: solution.score,
        assignments: solution.assignments.map((a: any) => ({
          employeeId: a.employeeId,
          shiftId: a.shiftId,
          startTime: new Date(a.startTime),
          endTime: new Date(a.endTime),
        })),
        metrics: solution.metrics || {},
        solveTime: solution.solveTime || 0,
      }));
  }

  /**
   * Gets optimization status
   */
  async getStatus(optimizationId: string): Promise<OptimizationResult | null> {
    return this.optimizationResults.get(optimizationId) || null;
  }

  /**
   * Generates a unique optimization ID
   */
  private generateOptimizationId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}


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
    const startTime = Date.now();

    this.logger.log(`Starting optimization process`, {
      optimizationId,
      startDate: optimizationRequest.startDate,
      endDate: optimizationRequest.endDate,
      employeeIds: optimizationRequest.employeeIds,
      options: optimizationRequest.options,
    });

    try {
      // Step 1: Collect current state
      this.logger.debug('Step 1: Collecting current state from database');
      const collectStateStart = Date.now();
      const currentState = await this.collectCurrentState(optimizationRequest);
      const collectStateTime = Date.now() - collectStateStart;
      
      this.logger.log(`Step 1 completed: Collected current state in ${collectStateTime}ms`, {
        employeeCount: currentState?.employees?.length || 0,
        shiftCount: currentState?.shifts?.length || 0,
        constraintCount: currentState?.constraints?.length || 0,
        scheduleCount: currentState?.currentSchedules?.length || 0,
      });

      // Validate that we have the minimum required data
      if (!currentState?.employees || currentState.employees.length === 0) {
        throw new Error('No employees found. Optimization requires at least one employee.');
      }

      if (!currentState?.shifts || currentState.shifts.length === 0) {
        throw new Error(
          `No shifts found in the specified date range (${optimizationRequest.startDate} to ${optimizationRequest.endDate}). ` +
          'Please ensure there are shifts in the selected date range, or adjust the date range to include existing shifts.'
        );
      }

      // Step 2: Call Python optimization service
      this.logger.debug('Step 2: Calling Python optimization service');
      const clientCallStart = Date.now();
      const optimizationResponse = await this.optimizationClient.requestOptimization(
        currentState,
      );
      const clientCallTime = Date.now() - clientCallStart;

      this.logger.log(`Step 2 completed: Received response from container in ${clientCallTime}ms`, {
        responseOptimizationId: optimizationResponse?.optimizationId,
        responseStatus: optimizationResponse?.status,
        rawSolutionCount: Array.isArray(optimizationResponse?.solutions) 
          ? optimizationResponse.solutions.length 
          : 0,
        totalSolveTime: optimizationResponse?.totalSolveTime,
        responseMessage: optimizationResponse?.message,
        responseKeys: optimizationResponse ? Object.keys(optimizationResponse) : [],
      });

      // Log raw response structure for debugging
      this.logger.debug('Raw optimization response from container', {
        fullResponse: JSON.stringify(optimizationResponse, null, 2),
      });

      // Step 3: Validate solutions
      this.logger.debug('Step 3: Validating solutions');
      const validateStart = Date.now();
      const validatedSolutions = await this.validateSolutions(
        optimizationResponse.solutions || [],
      );
      const validateTime = Date.now() - validateStart;

      this.logger.log(`Step 3 completed: Validated solutions in ${validateTime}ms`, {
        rawSolutionCount: Array.isArray(optimizationResponse?.solutions) 
          ? optimizationResponse.solutions.length 
          : 0,
        validatedSolutionCount: validatedSolutions.length,
        filteredOut: (Array.isArray(optimizationResponse?.solutions) 
          ? optimizationResponse.solutions.length 
          : 0) - validatedSolutions.length,
      });

      // Step 4: Create result
      this.logger.debug('Step 4: Creating final result');
      const finalOptimizationId = optimizationResponse.optimizationId || optimizationId;
      
      // Determine status with detailed logging
      let finalStatus: OptimizationStatus;
      if (optimizationResponse.status === 'completed') {
        finalStatus = OptimizationStatus.COMPLETED;
      } else if (optimizationResponse.status === 'partial') {
        finalStatus = OptimizationStatus.PARTIAL;
      } else {
        finalStatus = OptimizationStatus.FAILED;
      }

      this.logger.debug('Status mapping', {
        rawStatus: optimizationResponse.status,
        mappedStatus: finalStatus,
      });

      const result: OptimizationResult = {
        optimizationId: finalOptimizationId,
        status: finalStatus,
        solutions: validatedSolutions,
        totalSolveTime: optimizationResponse.totalSolveTime || 0,
        message:
          optimizationResponse.message ||
          `Generated ${validatedSolutions.length} valid solutions`,
      };

      // Store result using the final optimization ID (from response or generated)
      this.optimizationResults.set(finalOptimizationId, result);

      const totalTime = Date.now() - startTime;
      this.logger.log(`Optimization process completed successfully in ${totalTime}ms`, {
        optimizationId: finalOptimizationId,
        status: finalStatus,
        solutionCount: validatedSolutions.length,
        totalSolveTime: result.totalSolveTime,
        message: result.message,
      });

      // Log final result structure
      this.logger.debug('Final optimization result', {
        result: JSON.stringify(result, null, 2),
      });

      return result;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      this.logger.error(
        `Optimization failed after ${totalTime}ms: ${error.message}`,
        {
          optimizationId,
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          requestDetails: {
            startDate: optimizationRequest.startDate,
            endDate: optimizationRequest.endDate,
            employeeIds: optimizationRequest.employeeIds,
            options: optimizationRequest.options,
          },
        },
      );

      const result: OptimizationResult = {
        optimizationId,
        status: OptimizationStatus.FAILED,
        solutions: [],
        totalSolveTime: 0,
        message: `Optimization failed: ${error.message}`,
      };

      this.optimizationResults.set(optimizationId, result);
      
      this.logger.debug('Error result stored', {
        result: JSON.stringify(result, null, 2),
      });

      return result;
    }
  }

  /**
   * Collects current state from database
   */
  private async collectCurrentState(
    request: OptimizationRequestDto,
  ): Promise<any> {
    this.logger.debug('Collecting current state', {
      startDate: request.startDate,
      endDate: request.endDate,
      employeeIds: request.employeeIds,
      hasOptions: !!request.options,
    });

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
        this.logger.debug(`Fetching ${request.employeeIds.length} specific employees`);
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
        this.logger.debug(`Fetched ${state.employees.length} employees`);
      } else {
        this.logger.debug('Fetching all employees');
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
        this.logger.debug(`Fetched ${state.employees.length} employees`);
      }

      // Collect shifts (filter by date range if needed)
      this.logger.debug('Fetching shifts in date range', {
        startDate: request.startDate,
        endDate: request.endDate,
      });
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
      const rawShifts = shiftResult.shifts || [];
      this.logger.debug(`Fetched ${rawShifts.length} shifts from database`);
      
      // Transform shifts: convert required_skills from list to dictionary format
      // Python optimizer expects Dict[str, Any] but Hasura returns list format
      state.shifts = rawShifts.map((shift) => {
        const transformed = { ...shift };
        
        // Transform required_skills from list to dict format
        if (shift.required_skills) {
          if (Array.isArray(shift.required_skills)) {
            // Convert list format [{'name': 'skill'}] or ['skill'] to dict {'skill': true}
            const skillsDict: Record<string, any> = {};
            shift.required_skills.forEach((skill: any) => {
              const skillName = typeof skill === 'string' 
                ? skill 
                : (skill?.name || String(skill));
              if (skillName) {
                skillsDict[skillName] = true;
              }
            });
            transformed.required_skills = Object.keys(skillsDict).length > 0 ? skillsDict : null;
          } else if (typeof shift.required_skills === 'object' && !Array.isArray(shift.required_skills)) {
            // Already a dict, keep as is
            transformed.required_skills = shift.required_skills;
          } else {
            // Invalid format, set to null
            transformed.required_skills = null;
          }
        } else {
          transformed.required_skills = null;
        }
        
        return transformed;
      });
      
      this.logger.debug(`Transformed ${state.shifts.length} shifts for optimizer`, {
        sampleShift: state.shifts.length > 0 ? {
          id: state.shifts[0].id,
          required_skills: state.shifts[0].required_skills,
          start_time: state.shifts[0].start_time,
          end_time: state.shifts[0].end_time,
        } : null,
      });

      // Collect active constraints
      this.logger.debug('Fetching active constraints');
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
      // Transform constraints to match optimizer expectations
      state.constraints = (constraintsResult.constraints || []).map((constraint) => {
        const transformed = { ...constraint };
        // Transform max_hours constraint rules to match optimizer format
        if (constraint.type === 'max_hours' && constraint.rules) {
          const rules = { ...constraint.rules };
          // If maxHoursPerWeek exists, also set maxHours for optimizer compatibility
          if (rules.maxHoursPerWeek && !rules.maxHours) {
            rules.maxHours = rules.maxHoursPerWeek;
            rules.periodInDays = 7; // Weekly period
          }
          transformed.rules = rules;
        }
        return transformed;
      });
      this.logger.debug(`Fetched and transformed ${state.constraints.length} constraints`);

      // Fetch current schedules in date range
      this.logger.debug('Fetching current schedules in date range');
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
      this.logger.debug(`Fetched ${state.currentSchedules.length} existing schedules`);
      
      this.logger.debug('State collection summary', {
        employeeCount: state.employees.length,
        shiftCount: state.shifts.length,
        constraintCount: state.constraints.length,
        scheduleCount: state.currentSchedules.length,
      });
    } catch (error) {
      this.logger.error(
        `Failed to collect current state: ${error.message}`,
        {
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorStack: error instanceof Error ? error.stack : undefined,
          requestDetails: {
            startDate: request.startDate,
            endDate: request.endDate,
            employeeIds: request.employeeIds,
          },
        },
      );
      throw error;
    }

    return state;
  }

  /**
   * Validates optimization solutions
   */
  private async validateSolutions(solutions: any[]): Promise<any[]> {
    this.logger.debug('Validating solutions', {
      inputSolutionCount: Array.isArray(solutions) ? solutions.length : 0,
      isArray: Array.isArray(solutions),
      type: typeof solutions,
    });

    // Basic validation - check that solutions have required structure
    if (!Array.isArray(solutions)) {
      this.logger.warn('Solutions is not an array', {
        type: typeof solutions,
        value: solutions,
      });
      return [];
    }

    if (solutions.length === 0) {
      this.logger.warn('No solutions provided for validation');
      return [];
    }

    const validated = solutions
      .map((solution, index) => {
        const isValid = (
          solution &&
          typeof solution === 'object' &&
          Array.isArray(solution.assignments) &&
          typeof solution.score === 'number'
        );

        if (!isValid) {
          this.logger.debug(`Solution ${index} failed validation`, {
            hasSolution: !!solution,
            isObject: solution && typeof solution === 'object',
            hasAssignments: solution && Array.isArray(solution.assignments),
            hasScore: solution && typeof solution.score === 'number',
            solutionKeys: solution ? Object.keys(solution) : [],
          });
        }

        return { solution, isValid, index };
      })
      .filter(({ isValid }) => isValid)
      .map(({ solution, index }) => {
        try {
          const transformed = {
            id: solution.id || `solution_${Date.now()}_${index}`,
            score: solution.score,
            assignments: solution.assignments.map((a: any, assignmentIndex: number) => {
              try {
                return {
                  employeeId: a.employeeId,
                  shiftId: a.shiftId,
                  startTime: new Date(a.startTime),
                  endTime: new Date(a.endTime),
                };
              } catch (assignmentError) {
                this.logger.warn(`Failed to transform assignment ${assignmentIndex} in solution ${index}`, {
                  assignment: a,
                  error: assignmentError instanceof Error ? assignmentError.message : String(assignmentError),
                });
                throw assignmentError;
              }
            }),
            metrics: solution.metrics || {},
            solveTime: solution.solveTime || 0,
          };
          
          this.logger.debug(`Solution ${index} validated and transformed`, {
            solutionId: transformed.id,
            score: transformed.score,
            assignmentCount: transformed.assignments.length,
            solveTime: transformed.solveTime,
          });
          
          return transformed;
        } catch (transformError) {
          this.logger.error(`Failed to transform solution ${index}`, {
            error: transformError instanceof Error ? transformError.message : String(transformError),
            solution: solution,
          });
          throw transformError;
        }
      });

    this.logger.log('Solution validation completed', {
      inputCount: solutions.length,
      validatedCount: validated.length,
      filteredOut: solutions.length - validated.length,
    });

    return validated;
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


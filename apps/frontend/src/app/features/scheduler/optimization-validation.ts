/**
 * Validation utilities for optimization requests
 */

export interface OptimizationRequest {
  startDate: string;
  endDate: string;
  employeeIds?: string[];
  departmentIds?: string[];
  options?: {
    objective?: 'minimize_cost' | 'maximize_fairness' | 'balance';
    allowOvertime?: boolean;
    maxOptimizationTime?: number;
    solutionCount?: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates optimization request payload
 */
export function validateOptimizationRequest(
  request: Partial<OptimizationRequest>,
  context?: {
    employeeCount?: number;
    shiftCount?: number;
    constraintCount?: number;
  }
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required fields
  if (!request.startDate) {
    errors.push({
      field: 'startDate',
      message: 'Start date is required',
    });
  } else if (!isValidDate(request.startDate)) {
    errors.push({
      field: 'startDate',
      message: 'Start date must be a valid ISO date string',
    });
  }

  if (!request.endDate) {
    errors.push({
      field: 'endDate',
      message: 'End date is required',
    });
  } else if (!isValidDate(request.endDate)) {
    errors.push({
      field: 'endDate',
      message: 'End date must be a valid ISO date string',
    });
  }

  // Date range validation
  if (request.startDate && request.endDate && isValidDate(request.startDate) && isValidDate(request.endDate)) {
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);

    if (isNaN(start.getTime())) {
      errors.push({
        field: 'startDate',
        message: 'Start date is invalid',
      });
    }

    if (isNaN(end.getTime())) {
      errors.push({
        field: 'endDate',
        message: 'End date is invalid',
      });
    }

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (end <= start) {
        errors.push({
          field: 'endDate',
          message: 'End date must be after start date',
        });
      }

      // Check if date range is too large (optional warning)
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 90) {
        warnings.push({
          field: 'endDate',
          message: 'Date range exceeds 90 days. Optimization may take longer.',
        });
      }
    }
  }

  // Options validation
  if (request.options) {
    if (request.options.maxOptimizationTime !== undefined) {
      if (request.options.maxOptimizationTime < 1 || request.options.maxOptimizationTime > 300) {
        errors.push({
          field: 'options.maxOptimizationTime',
          message: 'Max optimization time must be between 1 and 300 seconds',
        });
      }
    }

    if (request.options.solutionCount !== undefined) {
      if (request.options.solutionCount < 1 || request.options.solutionCount > 10) {
        errors.push({
          field: 'options.solutionCount',
          message: 'Solution count must be between 1 and 10',
        });
      }
    }

    if (request.options.objective && !['minimize_cost', 'maximize_fairness', 'balance'].includes(request.options.objective)) {
      errors.push({
        field: 'options.objective',
        message: 'Objective must be one of: minimize_cost, maximize_fairness, balance',
      });
    }
  }

  // Context-based validation (if data is available)
  if (context) {
    if (context.employeeCount !== undefined && context.employeeCount === 0) {
      errors.push({
        field: 'employees',
        message: 'No employees available. Optimization requires at least one employee.',
      });
    }

    if (context.shiftCount !== undefined && context.shiftCount === 0) {
      errors.push({
        field: 'shifts',
        message: 'No shifts found in the selected date range. Please select a date range that contains shifts, or create shifts first.',
      });
    }

    if (context.constraintCount !== undefined && context.constraintCount === 0) {
      warnings.push({
        field: 'constraints',
        message: 'No active constraints found. Optimization works best with constraints defined.',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if a string is a valid ISO date
 */
function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('T') && dateString.includes('Z');
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  const errorMessages = errors.map((error) => {
    const fieldName = error.field.split('.').pop() || error.field;
    return `${fieldName}: ${error.message}`;
  });

  return errorMessages.join('\n');
}

/**
 * Formats validation warnings for display
 */
export function formatValidationWarnings(warnings: ValidationError[]): string {
  if (warnings.length === 0) {
    return '';
  }

  const warningMessages = warnings.map((warning) => {
    const fieldName = warning.field.split('.').pop() || warning.field;
    return `${fieldName}: ${warning.message}`;
  });

  return warningMessages.join('\n');
}


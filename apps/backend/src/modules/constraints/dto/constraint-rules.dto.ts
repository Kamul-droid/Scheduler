/**
 * Constraint Rules DTOs - Type-safe definitions for different constraint types
 */

// Max Hours Constraint Rules
export interface MaxHoursRule {
  maxHoursPerDay?: number;
  maxHoursPerWeek?: number;
  maxHoursPerMonth?: number;
  period?: 'day' | 'week' | 'month';
}

// Min Rest Constraint Rules
export interface MinRestRule {
  minRestHours: number;
  applyToConsecutiveShifts?: boolean;
}

// Fair Distribution Constraint Rules
export interface FairDistributionRule {
  shiftType: 'weekend' | 'night' | 'holiday' | 'all';
  distributionMethod: 'equal' | 'rotating' | 'preference';
  maxConsecutive?: number;
  minConsecutive?: number;
}

// Skill Requirement Constraint Rules
export interface SkillRequirementRule {
  requiredSkills: string[];
  strictMatch?: boolean; // If true, all skills must match
}

// Availability Constraint Rules
export interface AvailabilityRule {
  enforceAvailability: boolean;
  allowOverrides?: boolean;
}

// Max/Min Consecutive Days Rules
export interface ConsecutiveDaysRule {
  maxDays?: number;
  minDays?: number;
  dayType?: 'work' | 'rest';
}


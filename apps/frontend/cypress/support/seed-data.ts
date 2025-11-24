/// <reference types="cypress" />

import testData from '../fixtures/test-data.json';

const API_BASE = Cypress.env('apiUrl') || 'http://localhost:3000';

/**
 * Seeds the database with comprehensive test data based on platform description
 */
export function seedPlatformData() {
  const createdData: any = {
    departments: [],
    employees: [],
    shifts: [],
    constraints: [],
  };

  // Create departments
  cy.wrap(null).then(() => {
    return Cypress.Promise.all(
      testData.departments.map((dept) =>
        cy
          .request('POST', `${API_BASE}/departments`, dept)
          .then((response) => {
            createdData.departments.push(response.body);
          })
      )
    );
  });

  // Create employees (wait for departments)
  cy.wait(1000).then(() => {
    return Cypress.Promise.all(
      testData.employees.map((emp) =>
        cy
          .request('POST', `${API_BASE}/employees`, emp)
          .then((response) => {
            createdData.employees.push(response.body);
          })
      )
    );
  });

  // Create constraints
  cy.wait(1000).then(() => {
    return Cypress.Promise.all(
      testData.constraints.map((constraint) =>
        cy
          .request('POST', `${API_BASE}/constraints`, constraint)
          .then((response) => {
            createdData.constraints.push(response.body);
          })
      )
    );
  });

  // Create shifts (need department IDs)
  cy.wait(1000).then(() => {
    const shiftsWithDeptIds = testData.shifts.map((shift, index) => {
      const dept = createdData.departments[index % createdData.departments.length];
      return {
        ...shift,
        departmentId: dept?.id || '',
      };
    });

    return Cypress.Promise.all(
      shiftsWithDeptIds.map((shift) =>
        cy
          .request('POST', `${API_BASE}/shifts`, shift)
          .then((response) => {
            createdData.shifts.push(response.body);
          })
      )
    );
  });

  // Helper function to extract skill names from employee skills array
  const getEmployeeSkillNames = (employee: any): string[] => {
    if (!employee?.skills || !Array.isArray(employee.skills)) {
      return [];
    }
    return employee.skills.map((skill: any) => {
      if (typeof skill === 'string') return skill;
      return skill?.name || String(skill);
    });
  };
  
  // Helper function to extract required skill names from shift
  const getShiftRequiredSkillNames = (shift: any): string[] => {
    const requiredSkills = shift?.requiredSkills || shift?.required_skills;
    if (!requiredSkills) return [];
    if (Array.isArray(requiredSkills)) {
      return requiredSkills.map((skill: any) => {
        if (typeof skill === 'string') return skill;
        return skill?.name || String(skill);
      });
    }
    // If it's a dict (from optimizer transformation), extract keys
    if (typeof requiredSkills === 'object' && !Array.isArray(requiredSkills)) {
      return Object.keys(requiredSkills);
    }
    return [];
  };
  
  // Helper function to check if employee has required skills for shift
  const employeeHasRequiredSkills = (employee: any, shift: any): boolean => {
    const employeeSkills = getEmployeeSkillNames(employee);
    const shiftRequiredSkills = getShiftRequiredSkillNames(shift);
    
    if (shiftRequiredSkills.length === 0) {
      return true; // No requirements, any employee can work
    }
    
    // Employee must have ALL required skills
    return shiftRequiredSkills.every(skill => employeeSkills.includes(skill));
  };

  // Create schedules (need employee and shift IDs) with skill validation
  cy.wait(1000).then(() => {
    const validSchedules: any[] = [];
    
    // Match employees to shifts based on skills
    for (const schedule of testData.schedules) {
      let matched = false;
      for (const employee of createdData.employees) {
        for (const shift of createdData.shifts) {
          if (employeeHasRequiredSkills(employee, shift)) {
            validSchedules.push({
              ...schedule,
              employeeId: employee.id,
              shiftId: shift.id,
              startTime: schedule.startTime || shift.startTime || shift.start_time,
              endTime: schedule.endTime || shift.endTime || shift.end_time,
            });
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }

    // Create validated schedules
    return Cypress.Promise.all(
      validSchedules.map((schedule) =>
        cy
          .request({
            method: 'POST',
            url: `${API_BASE}/schedules`,
            body: schedule,
            failOnStatusCode: false,
          })
          .then((response) => {
            // Only add if successfully created
            if (response.status === 201 || response.status === 200) {
              createdData.schedules.push(response.body);
            }
          })
      )
    );
  });

  return cy.wrap(createdData);
}

/**
 * Creates a specific employee type for testing
 */
export function createEmployeeByRole(role: 'physician' | 'nurse' | 'nurse_practitioner') {
  const roleMappings = testData.userMappings.roles;
  const roleData = roleMappings[role === 'nurse' ? 'registered_nurse' : role];

  const baseEmployee = {
    name: `Test ${role}`,
    email: `test.${role}@hospital.com`,
    skills: roleData.requiredSkills.map((skill: string) => ({
      name: skill,
      level: 'intermediate',
      certifications: roleData.typicalCertifications,
      yearsExperience: 2,
    })),
    availabilityPattern: {
      type: roleData.typicalAvailability,
      preferredShifts: ['day'],
      unavailableDays: [],
      maxHoursPerWeek: roleData.typicalHoursPerWeek,
      minRestHours: 11,
    },
    metadata: {
      role: role === 'nurse' ? 'Registered Nurse' : role === 'physician' ? 'Physician' : 'Nurse Practitioner',
      employeeType: 'full_time',
    },
  };

  return cy.request('POST', `${API_BASE}/employees`, baseEmployee);
}

/**
 * Creates a shift for a specific department
 */
export function createShiftForDepartment(departmentName: string) {
  const deptMapping = testData.userMappings.departments[departmentName];
  if (!deptMapping) {
    throw new Error(`Department ${departmentName} not found in mappings`);
  }

  // Find department ID
  return cy.request('GET', `${API_BASE}/departments`).then((response) => {
    const department = response.body.find((d: any) => d.name === departmentName);
    if (!department) {
      throw new Error(`Department ${departmentName} not found in database`);
    }

    const shiftType = deptMapping.shiftCoverage === '24/7' ? 'day' : 'day';
    const shiftHours = testData.userMappings.shiftTypes[shiftType];

    const shift = {
      departmentId: department.id,
      requiredSkills: deptMapping.requiredCertifications.map((cert: string) => ({
        name: 'Nursing',
        level: 'intermediate',
        certifications: [cert],
      })),
      minStaffing: deptMapping.minStaffingPerShift,
      maxStaffing: deptMapping.minStaffingPerShift + 2,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + deptMapping.typicalShiftLength * 60 * 60 * 1000).toISOString(),
      metadata: {
        name: `${departmentName} ${shiftType} Shift`,
        shiftType,
        department: departmentName,
        priority: 'high',
      },
    };

    return cy.request('POST', `${API_BASE}/shifts`, shift);
  });
}

export { testData };


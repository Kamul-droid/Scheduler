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
      // Ensure requiredSkills is in correct format (array of objects with name)
      const requiredSkills = (shift as any).requiredSkills || (shift as any).required_skills || [];
      const formattedRequiredSkills = Array.isArray(requiredSkills)
        ? requiredSkills.map((skill: any) => 
            typeof skill === 'string' 
              ? { name: skill }
              : (skill.name ? { name: skill.name } : skill)
          )
        : [];
      
      return {
        ...shift,
        departmentId: dept?.id || '',
        requiredSkills: formattedRequiredSkills.length > 0 ? formattedRequiredSkills : undefined,
      };
    });

    return Cypress.Promise.all(
      shiftsWithDeptIds.map((shift) =>
        cy
          .request({
            method: 'POST',
            url: `${API_BASE}/shifts`,
            body: shift,
            failOnStatusCode: false,
          })
          .then((response) => {
            if (response.status === 201 || response.status === 200) {
              createdData.shifts.push(response.body);
            }
          })
      )
    );
  });

  // Create schedules (need employee and shift IDs)
  cy.wait(1000).then(() => {
    const schedulesWithIds = testData.schedules.map((schedule, index) => {
      const employee = createdData.employees[index % createdData.employees.length];
      const shift = createdData.shifts[index % createdData.shifts.length];
      return {
        ...schedule,
        employeeId: employee?.id || '',
        shiftId: shift?.id || '',
      };
    });

    return Cypress.Promise.all(
      schedulesWithIds.map((schedule) =>
        cy
          .request('POST', `${API_BASE}/schedules`, schedule)
          .then((response) => {
            createdData.schedules.push(response.body);
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
  const deptMapping = (testData.userMappings.departments as Record<string, any>)[departmentName];
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
    // const shiftHours = testData.userMappings.shiftTypes[shiftType]; // Not used currently

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


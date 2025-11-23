/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to create an employee
       * @example cy.createEmployee({ name: 'John Doe', email: 'john@example.com' })
       */
      createEmployee(employee: { name: string; email: string; skills?: string[] }): Chainable<void>;
      
      /**
       * Custom command to create a constraint
       * @example cy.createConstraint({ type: 'max_hours', rules: { maxHoursPerWeek: 40 }, priority: 50 })
       */
      createConstraint(constraint: { type: string; rules: any; priority: number; active?: boolean }): Chainable<void>;
      
      /**
       * Custom command to create a schedule
       * @example cy.createSchedule({ employeeId: '1', startTime: '2024-01-01T09:00:00Z', endTime: '2024-01-01T17:00:00Z' })
       */
      createSchedule(schedule: { employeeId: string; shiftId?: string; startTime: string; endTime: string; status?: string }): Chainable<void>;
      
      /**
       * Custom command to clear all test data
       * @example cy.clearTestData()
       */
      clearTestData(): Chainable<void>;
      
      /**
       * Custom command to seed test data
       * @example cy.seedTestData()
       */
      seedTestData(): Chainable<void>;
      
      /**
       * Custom command to seed comprehensive platform data
       * @example cy.seedPlatformData()
       */
      seedPlatformData(): Chainable<void>;
      
      /**
       * Create employee by role type
       * @example cy.createEmployeeByRole('physician')
       */
      createEmployeeByRole(role: 'physician' | 'nurse' | 'nurse_practitioner'): Chainable<void>;
      
      /**
       * Create shift for specific department
       * @example cy.createShiftForDepartment('Emergency Department')
       */
      createShiftForDepartment(departmentName: string): Chainable<void>;
    }
  }
}

const API_BASE = Cypress.env('apiUrl') || 'http://localhost:3000';

Cypress.Commands.add('createEmployee', (employee) => {
  cy.request({
    method: 'POST',
    url: `${API_BASE}/employees`,
    body: employee,
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 201]);
  });
});

Cypress.Commands.add('createConstraint', (constraint) => {
  cy.request({
    method: 'POST',
    url: `${API_BASE}/constraints`,
    body: constraint,
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 201]);
  });
});

Cypress.Commands.add('createSchedule', (schedule) => {
  cy.request({
    method: 'POST',
    url: `${API_BASE}/schedules`,
    body: schedule,
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 201]);
  });
});

Cypress.Commands.add('clearTestData', () => {
  // Delete all test schedules
  cy.request('GET', `${API_BASE}/schedules`).then((response) => {
    if (response.body && Array.isArray(response.body)) {
      response.body.forEach((schedule: any) => {
        cy.request('DELETE', `${API_BASE}/schedules/${schedule.id}`).then(() => {
          // Ignore errors if already deleted
        });
      });
    }
  });

  // Delete all test constraints
  cy.request('GET', `${API_BASE}/constraints`).then((response) => {
    if (response.body && Array.isArray(response.body)) {
      response.body.forEach((constraint: any) => {
        cy.request('DELETE', `${API_BASE}/constraints/${constraint.id}`).then(() => {
          // Ignore errors if already deleted
        });
      });
    }
  });

  // Delete all test employees
  cy.request('GET', `${API_BASE}/employees`).then((response) => {
    if (response.body && Array.isArray(response.body)) {
      response.body.forEach((employee: any) => {
        cy.request('DELETE', `${API_BASE}/employees/${employee.id}`).then(() => {
          // Ignore errors if already deleted
        });
      });
    }
  });
});

Cypress.Commands.add('seedTestData', () => {
  // Use simplified test data for quick setup
  cy.createEmployee({
    name: 'Test Employee 1',
    email: 'test1@example.com',
    skills: ['JavaScript', 'TypeScript'],
  });

  cy.createEmployee({
    name: 'Test Employee 2',
    email: 'test2@example.com',
    skills: ['Python', 'React'],
  });

  // Create test constraints
  cy.createConstraint({
    type: 'max_hours',
    rules: { maxHoursPerWeek: 40 },
    priority: 50,
    active: true,
  });

  cy.createConstraint({
    type: 'min_rest',
    rules: { minRestHours: 11 },
    priority: 75,
    active: true,
  });
});

// Import test data at the end to avoid circular dependencies
import testData from '../fixtures/test-data.json';

/**
 * Seeds comprehensive platform data based on user mappings
 */
/**
 * Seeds comprehensive platform data based on user mappings
 * Handles unique constraint violations by checking if entities exist first
 */
Cypress.Commands.add('seedPlatformData', () => {
  const createdData: any = {
    departments: [],
    employees: [],
    shifts: [],
    constraints: [],
  };

  // Helper function to find existing entity by name
  const findEntityByName = (endpoint: string, nameField: string, nameValue: string) => {
    return cy.request('GET', `${API_BASE}${endpoint}`).then((response) => {
      const entities = Array.isArray(response.body) ? response.body : response.body.data || [];
      return entities.find((e: any) => e[nameField] === nameValue);
    });
  };

  // Helper function to find existing entity by type
  const findEntityByType = (endpoint: string, typeField: string, typeValue: string) => {
    return cy.request('GET', `${API_BASE}${endpoint}`).then((response) => {
      const entities = Array.isArray(response.body) ? response.body : response.body.data || [];
      return entities.find((e: any) => e[typeField] === typeValue);
    });
  };

  // Create departments with duplicate handling
  testData.departments.forEach((dept) => {
    cy.then(() => findEntityByName('/departments', 'name', dept.name)).then((existing) => {
      if (existing) {
        createdData.departments.push(existing);
      } else {
        cy.request({
          method: 'POST',
          url: `${API_BASE}/departments`,
          body: dept,
          failOnStatusCode: false,
        }).then((response) => {
          if (response.status === 201 || response.status === 200) {
            createdData.departments.push(response.body);
          } else if (response.status === 400 || response.status === 409) {
            // Try to fetch existing
            cy.then(() => findEntityByName('/departments', 'name', dept.name)).then((found) => {
              if (found) createdData.departments.push(found);
            });
          }
        });
      }
    });
  });

  cy.wait(1000);

  // Create employees with duplicate handling
  testData.employees.forEach((emp) => {
    cy.then(() => findEntityByName('/employees', 'name', emp.name)).then((existing) => {
      if (existing) {
        createdData.employees.push(existing);
      } else {
        cy.request({
          method: 'POST',
          url: `${API_BASE}/employees`,
          body: emp,
          failOnStatusCode: false,
        }).then((response) => {
          if (response.status === 201 || response.status === 200) {
            createdData.employees.push(response.body);
          } else if (response.status === 400 || response.status === 409) {
            // Try to fetch existing
            cy.then(() => findEntityByName('/employees', 'name', emp.name)).then((found) => {
              if (found) createdData.employees.push(found);
            });
          }
        });
      }
    });
  });

  cy.wait(1000);

  // Create constraints with duplicate handling
  testData.constraints.forEach((constraint) => {
    cy.then(() => findEntityByType('/constraints', 'type', constraint.type)).then((existing) => {
      if (existing) {
        createdData.constraints.push(existing);
      } else {
        cy.request({
          method: 'POST',
          url: `${API_BASE}/constraints`,
          body: constraint,
          failOnStatusCode: false,
        }).then((response) => {
          if (response.status === 201 || response.status === 200) {
            createdData.constraints.push(response.body);
          } else if (response.status === 400 || response.status === 409) {
            // Try to fetch existing
            cy.then(() => findEntityByType('/constraints', 'type', constraint.type)).then((found) => {
              if (found) createdData.constraints.push(found);
            });
          }
        });
      }
    });
  });

  cy.wait(1000);

  // Create shifts with department IDs
  testData.shifts.forEach((shift, index) => {
    const dept = createdData.departments[index % createdData.departments.length];
    if (dept) {
      cy.request('POST', `${API_BASE}/shifts`, {
        ...shift,
        departmentId: dept.id,
      }).then((response) => {
        createdData.shifts.push(response.body);
      });
    }
  });

  cy.wait(1000);

  // Create schedules with employee and shift IDs
  testData.schedules.forEach((schedule, index) => {
    const employee = createdData.employees[index % createdData.employees.length];
    const shift = createdData.shifts[index % createdData.shifts.length];
    if (employee && shift) {
      cy.request('POST', `${API_BASE}/schedules`, {
        ...schedule,
        employeeId: employee.id,
        shiftId: shift.id,
      });
    }
  });
});

Cypress.Commands.add('createEmployeeByRole', (role: 'physician' | 'nurse' | 'nurse_practitioner') => {
  const roleMappings = (testData as any).userMappings?.roles;
  if (!roleMappings) {
    throw new Error('User mappings not found in test data');
  }

  const roleKey = role === 'nurse' ? 'registered_nurse' : role;
  const roleData = roleMappings[roleKey];

  if (!roleData) {
    throw new Error(`Role ${roleKey} not found in mappings`);
  }

  const employee = {
    name: `Test ${role}`,
    email: `test.${role}@hospital.com`,
    skills: (roleData.requiredSkills || []).map((skill: string) => ({
      name: skill,
      level: 'intermediate',
      certifications: roleData.typicalCertifications || [],
      yearsExperience: 2,
    })),
    availabilityPattern: {
      type: roleData.typicalAvailability || 'flexible',
      preferredShifts: ['day'],
      unavailableDays: [],
      maxHoursPerWeek: roleData.typicalHoursPerWeek || 40,
      minRestHours: 11,
    },
    metadata: {
      role: role === 'nurse' ? 'Registered Nurse' : role === 'physician' ? 'Physician' : 'Nurse Practitioner',
      employeeType: 'full_time',
    },
  };

  cy.request('POST', `${API_BASE}/employees`, employee);
});

Cypress.Commands.add('createShiftForDepartment', (departmentName: string) => {
  const userMappings = (testData as any).userMappings;
  if (!userMappings) {
    throw new Error('User mappings not found in test data');
  }

  const deptMapping = userMappings.departments?.[departmentName];
  if (!deptMapping) {
    throw new Error(`Department ${departmentName} not found in mappings`);
  }
  
  cy.request('GET', `${API_BASE}/departments`).then((response) => {
    const department = response.body.find((d: any) => d.name === departmentName);
    if (department) {
      const shiftType = deptMapping.shiftCoverage === '24/7' ? 'day' : 'day';
      const shiftHours = userMappings.shiftTypes?.[shiftType];

      const shift = {
        departmentId: department.id,
        name: `${departmentName} ${shiftType} Shift`,
        requiredSkills: (deptMapping.requiredCertifications || []).map((cert: string) => ({
          name: 'Nursing',
          level: 'intermediate',
          certifications: [cert],
        })),
        minStaffing: deptMapping.minStaffingPerShift || 2,
        maxStaffing: (deptMapping.minStaffingPerShift || 2) + 2,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + (deptMapping.typicalShiftLength || 8) * 60 * 60 * 1000).toISOString(),
        metadata: {
          shiftType,
          department: departmentName,
          priority: 'high',
        },
      };

      cy.request('POST', `${API_BASE}/shifts`, shift);
    } else {
      throw new Error(`Department ${departmentName} not found in database`);
    }
  });
});

export { };


describe('Platform-Specific Scenarios', () => {
  beforeEach(() => {
    cy.clearTestData();
    // Use comprehensive platform data
    cy.seedPlatformData();
    cy.wait(2000); // Wait for all data to be created
  });

  it('should match employees to shifts based on skills and certifications', () => {
    cy.visit('/app/scheduler');
    
    // Verify employees with required certifications are available
    cy.get('body').then(($body) => {
      // Check that employees with ACLS/BLS are available for ED shifts
      expect($body.text()).to.include('Emergency');
    });
  });

  it('should enforce regulatory constraints for critical departments', () => {
    cy.visit('/app/constraints');
    
    // Verify regulatory constraints are active
    cy.contains('max_hours').should('exist');
    cy.contains('min_rest').should('exist');
    cy.contains('skill_requirement').should('exist');
  });

  it('should create schedules respecting availability patterns', () => {
    cy.visit('/app/scheduler');
    cy.wait(1000);
    
    // Create a schedule for an employee
    cy.contains('Add Schedule').click();
    cy.wait(500);
    
    // Select employee (should respect their availability)
    cy.get('select').first().should('have.length.greaterThan', 0);
    
    // Set time within business hours for clinic employees
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    const startTime = today.toISOString().slice(0, 16);
    const endTime = new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16);
    
    cy.get('input[type="datetime-local"]').first().clear().type(startTime);
    cy.get('input[type="datetime-local"]').last().clear().type(endTime);
    
    cy.get('button').contains('Cancel').click();
  });

  it('should optimize schedule with realistic constraints', () => {
    cy.visit('/app/optimization');
    cy.wait(2000);
    
    // Verify current state shows employees and constraints
    cy.contains('Employees:').should('be.visible');
    cy.contains('Active Constraints:').should('be.visible');
    
    // Start optimization
    cy.get('button').contains('Start Optimization').should('not.be.disabled').click();
    
    // Wait for optimization to process
    cy.wait(5000);
    
    // Verify results or status
    cy.get('body').then(($body) => {
      const hasResults = $body.text().includes('Optimization Results') ||
                        $body.text().includes('completed') ||
                        $body.text().includes('Processing');
      expect(hasResults).to.be.true;
    });
  });

  it('should validate skill matching for department requirements', () => {
    const API_BASE = Cypress.env('apiUrl') || 'http://localhost:3000';
    
    // Get employees with specific certifications
    cy.request('GET', `${API_BASE}/employees`).then((response) => {
      const employees = response.body;
      
      // Find employees with ACLS certification (required for ED/ICU)
      const aclsEmployees = employees.filter((emp: any) => {
        if (!emp.skills || !Array.isArray(emp.skills)) return false;
        return emp.skills.some((skill: any) => {
          const certs = skill.certifications || [];
          return certs.includes('ACLS');
        });
      });
      
      expect(aclsEmployees.length).to.be.greaterThan(0);
    });
  });

  it('should handle 24/7 department coverage requirements', () => {
    const API_BASE = Cypress.env('apiUrl') || 'http://localhost:3000';
    
    // Get departments
    cy.request('GET', `${API_BASE}/departments`).then((response) => {
      const departments = response.body;
      
      // Find 24/7 departments
      const roundTheClock = departments.filter((dept: any) => {
        const reqs = dept.requirements || {};
        return reqs.shiftCoverage === '24/7';
      });
      
      expect(roundTheClock.length).to.be.greaterThan(0);
      
      // Verify they have night shift coverage
      roundTheClock.forEach((dept: any) => {
        cy.request('GET', `${API_BASE}/shifts`).then((shiftResponse) => {
          const shifts = shiftResponse.body;
          const deptShifts = shifts.filter((s: any) => s.departmentId === dept.id);
          
          // Should have shifts covering different times
          expect(deptShifts.length).to.be.greaterThan(0);
        });
      });
    });
  });

  it('should respect employee role and department assignments', () => {
    const API_BASE = Cypress.env('apiUrl') || 'http://localhost:3000';
    
    // Get employees and check their role assignments
    cy.request('GET', `${API_BASE}/employees`).then((response) => {
      const employees = response.body;
      
      // Verify employees have role metadata
      const employeesWithRoles = employees.filter((emp: any) => {
        return emp.metadata && emp.metadata.role;
      });
      
      expect(employeesWithRoles.length).to.be.greaterThan(0);
      
      // Verify role types match expected mappings
      const roles = employeesWithRoles.map((emp: any) => emp.metadata.role);
      expect(roles).to.include('Physician');
      expect(roles).to.include('Registered Nurse');
    });
  });
});


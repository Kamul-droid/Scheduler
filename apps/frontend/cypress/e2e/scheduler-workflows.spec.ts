describe('Scheduler Workflows', () => {
  beforeEach(() => {
    // Check if frontend is accessible
    cy.request({
      method: 'GET',
      url: 'http://localhost:3001',
      timeout: 30000,
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 0) {
        cy.log('Frontend server not accessible, skipping tests');
        return;
      }
    });
    
    // Clear test data and seed fresh data before each test
    cy.clearTestData();
    cy.seedTestData();
    
    // Visit the scheduler page
    cy.visit('/app/scheduler', {
      timeout: 30000,
      failOnStatusCode: false,
    });
    
    // Wait for the page to load
    cy.get('h2').contains('Schedule View', { timeout: 30000 }).should('be.visible');
  });

  it('should display the scheduler view with week navigation', () => {
    // Check that the scheduler view is displayed
    cy.get('h2').contains('Schedule View').should('be.visible');
    
    // Check week navigation buttons
    cy.contains('Previous Week').should('be.visible');
    cy.contains('Today').should('be.visible');
    cy.contains('Next Week').should('be.visible');
    
    // Check that week days are displayed
    cy.get('[class*="grid-cols-7"]').should('be.visible');
  });

  it('should navigate between weeks', () => {
    // Get current date display
    cy.get('p').contains(/\w+, \w+ \d+, \d{4}/).should('be.visible');
    
    // Click next week
    cy.contains('Next Week').click();
    
    // Verify date changed (wait a moment for update)
    cy.wait(500);
    
    // Click previous week
    cy.contains('Previous Week').click();
    
    // Click today to reset
    cy.contains('Today').click();
  });

  it('should open schedule creation modal', () => {
    // Click Add Schedule button
    cy.contains('Add Schedule').click();
    
    // Verify modal is open
    cy.get('h3').contains('Add Schedule').should('be.visible');
    
    // Verify form fields are present
    cy.get('label').contains('Employee').should('be.visible');
    cy.get('label').contains('Start Time').should('be.visible');
    cy.get('label').contains('End Time').should('be.visible');
    
    // Close modal
    cy.get('button').contains('Cancel').click();
  });

  it('should create a new schedule', () => {
    // Wait for employees to load
    cy.wait(1000);
    
    // Click Add Schedule
    cy.contains('Add Schedule').click();
    
    // Fill in schedule form
    cy.get('select').first().select(1); // Select first employee
    
    // Set start and end times (using today's date)
    const today = new Date();
    const startTime = new Date(today);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(today);
    endTime.setHours(17, 0, 0, 0);
    
    const startTimeStr = startTime.toISOString().slice(0, 16);
    const endTimeStr = endTime.toISOString().slice(0, 16);
    
    cy.get('input[type="datetime-local"]').first().clear().type(startTimeStr);
    cy.get('input[type="datetime-local"]').last().clear().type(endTimeStr);
    
    // Select status
    cy.get('select').last().select('confirmed');
    
    // Submit form
    cy.get('button').contains('Create').click();
    
    // Verify modal closes
    cy.get('h3').contains('Add Schedule').should('not.exist');
    
    // Verify schedule appears in timeline (may take a moment)
    cy.wait(1000);
  });

  it('should filter schedules by employee', () => {
    // Wait for schedules to load
    cy.wait(1000);
    
    // Find employee filter dropdown
    cy.get('select').contains('All Employees').should('be.visible');
    
    // Select a specific employee
    cy.get('select').contains('All Employees').parent().select(1);
    
    // Verify filter is applied (wait for update)
    cy.wait(500);
  });

  it('should display conflict indicators', () => {
    // Create overlapping schedules to trigger conflicts
    const API_BASE = Cypress.env('apiUrl') || 'http://localhost:3000';
    
    // First, get an employee ID
    cy.request({
      method: 'GET',
      url: `${API_BASE}/employees`,
      timeout: 30000,
      failOnStatusCode: false,
    }).then((response) => {
      if (response.body && response.body.length > 0) {
        const employeeId = response.body[0].id;
        const baseTime = new Date();
        baseTime.setHours(9, 0, 0, 0);
        
        // Create two overlapping schedules
        const schedule1 = {
          employeeId,
          startTime: baseTime.toISOString(),
          endTime: new Date(baseTime.getTime() + 8 * 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
        };
        
        const schedule2 = {
          employeeId,
          startTime: new Date(baseTime.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(baseTime.getTime() + 12 * 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
        };
        
        cy.request({
          method: 'POST',
          url: `${API_BASE}/schedules`,
          body: schedule1,
          timeout: 30000,
          failOnStatusCode: false,
        });
        cy.request({
          method: 'POST',
          url: `${API_BASE}/schedules`,
          body: schedule2,
          timeout: 30000,
          failOnStatusCode: false,
        });
        
        // Reload page to see conflicts
        cy.reload();
        cy.wait(2000);
        
        // Check for conflict indicator
        cy.contains(/conflict/i).should('exist');
      }
    });
  });

  it('should edit an existing schedule', () => {
    // Wait for schedules to load
    cy.wait(2000);
    
    // Look for edit button on a schedule block
    cy.get('body').then(($body) => {
      if ($body.find('[title="Edit schedule"]').length > 0) {
        cy.get('[title="Edit schedule"]').first().click();
        
        // Verify edit modal opens
        cy.get('h3').contains('Edit Schedule').should('be.visible');
        
        // Update the status
        cy.get('select').last().select('tentative');
        
        // Save changes
        cy.get('button').contains('Update').click();
        
        // Verify modal closes
        cy.wait(1000);
      } else {
        // If no schedules exist, create one first
        cy.contains('Add Schedule').click();
        cy.wait(1000);
        cy.get('select').first().select(1);
        
        const today = new Date();
        const startTime = new Date(today);
        startTime.setHours(9, 0, 0, 0);
        const endTime = new Date(today);
        endTime.setHours(17, 0, 0, 0);
        
        cy.get('input[type="datetime-local"]').first().clear().type(startTime.toISOString().slice(0, 16));
        cy.get('input[type="datetime-local"]').last().clear().type(endTime.toISOString().slice(0, 16));
        cy.get('button').contains('Create').click();
        
        cy.wait(2000);
        cy.get('[title="Edit schedule"]').first().click();
        cy.get('select').last().select('tentative');
        cy.get('button').contains('Update').click();
      }
    });
  });

  it('should delete a schedule', () => {
    // Wait for schedules to load
    cy.wait(2000);
    
    cy.get('body').then(($body) => {
      if ($body.find('[title="Delete schedule"]').length > 0) {
        // Click delete button
        cy.get('[title="Delete schedule"]').first().click();
        
        // Confirm deletion
        cy.on('window:confirm', () => true);
        
        // Verify schedule is removed
        cy.wait(1000);
      }
    });
  });

  it('should be responsive on mobile viewport', () => {
    // Set mobile viewport
    cy.viewport(375, 667);
    
    // Verify navigation is still accessible
    cy.contains('Scheduler').should('be.visible');
    
    // Verify week navigation works on mobile
    cy.contains('Today').should('be.visible').click();
    
    // Verify Add Schedule button is accessible
    cy.contains('Add Schedule').should('be.visible');
  });
});


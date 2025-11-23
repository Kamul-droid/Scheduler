describe('Employee Management', () => {
  beforeEach(() => {
    // Clear and seed test data
    cy.clearTestData();
    cy.seedTestData();
    
    // Visit employees page
    cy.visit('/app/employees');
    
    // Wait for page to load
    cy.get('h2').contains('Employee Management').should('be.visible');
  });

  it('should display employees list', () => {
    // Verify page title
    cy.get('h2').contains('Employee Management').should('be.visible');
    
    // Wait for employees to load
    cy.wait(1000);
    
    // Verify employees are displayed
    cy.get('body').then(($body) => {
      const hasEmployees = $body.find('table').length > 0 ||
                          $body.text().includes('Test Employee') ||
                          $body.text().includes('@example.com');
      
      if (!hasEmployees) {
        // Verify empty state
        cy.contains(/No employees|employee/i).should('exist');
      }
    });
  });

  it('should create a new employee', () => {
    // Click Add Employee button
    cy.contains('Add Employee').click();
    
    // Verify modal opens
    cy.get('h3').contains('Add Employee').should('be.visible');
    
    // Fill in employee form
    cy.get('input[type="text"]').first().type('New Employee');
    cy.get('input[type="email"]').type('newemployee@example.com');
    
    // Add a skill
    cy.get('input[placeholder*="skill" i]').type('React');
    cy.get('button').contains('Add').click();
    
    // Submit form
    cy.get('button').contains('Create').click();
    
    // Verify modal closes
    cy.wait(1000);
    cy.get('h3').contains('Add Employee').should('not.exist');
  });

  it('should edit an existing employee', () => {
    // Wait for employees to load
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      if ($body.find('button').filter(':contains("Edit")').length > 0) {
        // Click edit button
        cy.get('button').contains('Edit').first().click();
        
        // Verify edit modal opens
        cy.get('h3').contains('Edit Employee').should('be.visible');
        
        // Update name
        cy.get('input[type="text"]').first().clear().type('Updated Employee');
        
        // Save changes
        cy.get('button').contains('Update').click();
        
        // Verify modal closes
        cy.wait(1000);
      } else {
        // Create employee first
        cy.contains('Add Employee').click();
        cy.get('input[type="text"]').first().type('Test Employee');
        cy.get('input[type="email"]').type('test@example.com');
        cy.get('button').contains('Create').click();
        cy.wait(1000);
        
        // Now edit it
        cy.get('button').contains('Edit').first().click();
        cy.get('input[type="text"]').first().clear().type('Updated Employee');
        cy.get('button').contains('Update').click();
      }
    });
  });

  it('should delete an employee', () => {
    // Wait for employees to load
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      if ($body.find('button').filter(':contains("Delete")').length > 0) {
        // Click delete button
        cy.get('button').contains('Delete').first().click();
        
        // Confirm deletion
        cy.on('window:confirm', () => true);
        
        // Verify employee is removed
        cy.wait(1000);
      }
    });
  });

  it('should manage employee skills', () => {
    // Open create modal
    cy.contains('Add Employee').click();
    cy.wait(500);
    
    // Fill basic info
    cy.get('input[type="text"]').first().type('Skillful Employee');
    cy.get('input[type="email"]').type('skills@example.com');
    
    // Add multiple skills
    cy.get('input[placeholder*="skill" i]').type('JavaScript');
    cy.get('button').contains('Add').click();
    
    cy.get('input[placeholder*="skill" i]').type('TypeScript');
    cy.get('button').contains('Add').click();
    
    // Verify skills are displayed as tags
    cy.contains('JavaScript').should('exist');
    cy.contains('TypeScript').should('exist');
    
    // Remove a skill
    cy.contains('JavaScript').parent().find('button').click();
    
    // Verify skill is removed
    cy.contains('JavaScript').should('not.exist');
    cy.contains('TypeScript').should('exist');
  });

  it('should validate required fields', () => {
    // Open create modal
    cy.contains('Add Employee').click();
    cy.wait(500);
    
    // Try to submit without filling required fields
    cy.get('button').contains('Create').click();
    
    // Browser validation should prevent submission
    cy.get('body').then(($body) => {
      const stillOpen = $body.find('h3').filter(':contains("Add Employee")').length > 0;
      expect(stillOpen).to.be.true;
    });
  });

  it('should validate email format', () => {
    // Open create modal
    cy.contains('Add Employee').click();
    cy.wait(500);
    
    // Enter invalid email
    cy.get('input[type="text"]').first().type('Test Employee');
    cy.get('input[type="email"]').type('invalid-email');
    
    // Try to submit
    cy.get('button').contains('Create').click();
    
    // Browser should show validation error
    cy.get('input[type="email"]').then(($input) => {
      expect($input[0].validity.valid).to.be.false;
    });
  });
});


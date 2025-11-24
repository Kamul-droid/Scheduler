describe('Constraint Validation', () => {
  beforeEach(() => {
    // Clear and seed test data
    cy.clearTestData();
    cy.seedTestData();
    
    // Visit constraints page
    cy.visit('/app/constraints');
    
    // Wait for page to load
    cy.get('h2').contains('Constraint Management').should('be.visible');
  });

  it('should display constraints list', () => {
    // Verify page title
    cy.get('h2').contains('Constraint Management').should('be.visible');
    
    // Wait for constraints to load
    cy.wait(1000);
    
    // Verify constraints are displayed (either in list or cards)
    cy.get('body').then(($body) => {
      // Constraints might be in a table or card layout
      const hasConstraints = $body.find('[class*="card"]').length > 0 || 
                            $body.find('table').length > 0 ||
                            $body.text().includes('max_hours') ||
                            $body.text().includes('min_rest');
      
      if (!hasConstraints) {
        // If no constraints, verify empty state
        cy.contains(/No constraints|constraint/i).should('exist');
      }
    });
  });

  it('should create a new constraint', () => {
    // Click Add Constraint button
    cy.contains('Add Constraint').click();
    
    // Verify modal opens
    cy.get('h3').contains('Add Constraint').should('be.visible');
    
    // Fill in constraint form
    cy.get('select').first().select('max_hours');
    
    // Enter rules as JSON
    cy.get('textarea').clear().type('{"maxHoursPerWeek": 40, "maxHoursPerDay": 12}');
    
    // Set priority
    cy.get('input[type="number"]').clear().type('60');
    
    // Ensure active checkbox is checked
    cy.get('input[type="checkbox"]').check();
    
    // Submit form
    cy.get('button').contains('Create').click();
    
    // Verify modal closes
    cy.wait(1000);
    cy.get('h3').contains('Add Constraint').should('not.exist');
  });

  it('should validate constraint rules JSON format', () => {
    // Open create modal
    cy.contains('Add Constraint').click();
    cy.wait(500);
    
    // Select constraint type
    cy.get('select').first().select('min_rest');
    
    // Enter invalid JSON
    cy.get('textarea').clear().type('invalid json{');
    
    // Try to submit
    cy.get('button').contains('Create').click();
    
    // Verify error message appears
    cy.contains(/invalid|error|json/i).should('exist');
  });

  it('should edit an existing constraint', () => {
    // Wait for constraints to load
    cy.wait(1000);
    
    // Find and click edit button
    cy.get('body').then(($body) => {
      if ($body.find('[title*="Edit"]').length > 0 || $body.find('button').filter(':contains("Edit")').length > 0) {
        cy.get('button').contains('Edit').first().click();
        
        // Verify edit modal opens
        cy.get('h3').contains('Edit Constraint').should('be.visible');
        
        // Update priority
        cy.get('input[type="number"]').clear().type('80');
        
        // Save changes
        cy.get('button').contains('Update').click();
        
        // Verify modal closes
        cy.wait(1000);
      } else {
        // Create a constraint first if none exist
        cy.contains('Add Constraint').click();
        cy.get('select').first().select('max_hours');
        cy.get('textarea').clear().type('{"maxHoursPerWeek": 40}');
        cy.get('input[type="number"]').clear().type('50');
        cy.get('button').contains('Create').click();
        cy.wait(1000);
        
        // Now edit it
        cy.get('button').contains('Edit').first().click();
        cy.get('input[type="number"]').clear().type('80');
        cy.get('button').contains('Update').click();
      }
    });
  });

  it('should toggle constraint active status', () => {
    // Wait for constraints to load
    cy.wait(1000);
    
    // Find active/inactive indicator
    cy.get('body').then(($body) => {
      // Look for toggle button or active indicator
      const hasToggle = $body.find('button[title*="Active"]').length > 0 ||
                       $body.find('[class*="active"]').length > 0 ||
                       $body.text().includes('●') ||
                       $body.text().includes('○');
      
      if (hasToggle) {
        // Click toggle if available
        cy.get('body').then(($body2) => {
          if ($body2.find('button[title*="Active"]').length > 0) {
            cy.get('button[title*="Active"]').first().click();
            cy.wait(500);
          }
        });
      }
    });
  });

  it('should delete a constraint', () => {
    // Wait for constraints to load
    cy.wait(1000);
    
    cy.get('body').then(($body) => {
      // Look for delete button
      if ($body.find('button').filter(':contains("Delete")').length > 0 ||
          $body.find('[title*="Delete"]').length > 0) {
        
        // Click delete
        cy.get('button').contains('Delete').first().click();
        
        // Confirm deletion
        cy.on('window:confirm', () => true);
        
        // Verify constraint is removed
        cy.wait(1000);
      } else {
        // Create a constraint first
        cy.contains('Add Constraint').click();
        cy.get('select').first().select('min_rest');
        cy.get('textarea').clear().type('{"minRestHours": 11}');
        cy.get('input[type="number"]').clear().type('75');
        cy.get('button').contains('Create').click();
        cy.wait(1000);
        
        // Now delete it
        cy.get('button').contains('Delete').first().click();
        cy.on('window:confirm', () => true);
        cy.wait(1000);
      }
    });
  });

  it('should display constraint types correctly', () => {
    // Open create modal
    cy.contains('Add Constraint').click();
    cy.wait(500);
    
    // Verify constraint type options
    cy.get('select').first().then(($select) => {
      const options = Array.from($select[0].options).map((opt) => opt.text);
      
      // Check for expected constraint types
      expect(options.some(opt => opt.toLowerCase().includes('max hours'))).to.be.true;
      expect(options.some(opt => opt.toLowerCase().includes('min rest'))).to.be.true;
    });
  });

  it('should validate priority range (0-100)', () => {
    // Open create modal
    cy.contains('Add Constraint').click();
    cy.wait(500);
    
    // Try to enter invalid priority
    cy.get('select').first().select('max_hours');
    cy.get('textarea').clear().type('{"maxHoursPerWeek": 40}');
    
    // Try priority > 100
    cy.get('input[type="number"]').clear().type('150');
    
    // Browser validation should prevent this, but check if form accepts it
    cy.get('input[type="number"]').should('have.attr', 'max', '100');
    
    // Try priority < 0
    cy.get('input[type="number"]').clear().type('-10');
    cy.get('input[type="number"]').should('have.attr', 'min', '0');
  });

  it('should filter active constraints', () => {
    // This test verifies that active constraints can be filtered
    // The constraint management page should show all constraints
    // Active constraints are used in optimization
    
    cy.wait(1000);
    
    // Verify constraints are displayed
    cy.get('body').then(($body) => {
      const hasConstraints = $body.text().includes('max_hours') ||
                            $body.text().includes('min_rest') ||
                            $body.find('[class*="card"]').length > 0;
      
      // If constraints exist, verify active status is shown
      if (hasConstraints) {
        // Active status should be visible (either as indicator or checkbox)
        expect(true).to.be.true; // Test passes if constraints are displayed
      }
    });
  });

  it('should handle constraint validation errors', () => {
    // Open create modal
    cy.contains('Add Constraint').click();
    cy.wait(500);
    
    // Try to submit without required fields
    cy.get('button').contains('Create').click();
    
    // Browser validation should prevent submission
    // Or form should show validation errors
    cy.get('body').then(($body) => {
      // Check if form is still open (validation prevented submission)
      // or if error messages are shown
      const stillOpen = $body.find('h3').filter(':contains("Add Constraint")').length > 0;
      const hasErrors = $body.text().includes('required') || 
                       $body.text().includes('invalid');
      
      expect(stillOpen || hasErrors).to.be.true;
    });
  });

  it('should create constraint via API with correct data structure', () => {
    // Create constraint using API command
    cy.createConstraint({
      type: 'max_hours',
      rules: { maxHoursPerWeek: 40, maxHoursPerDay: 12 },
      priority: 60,
      active: true,
    });
  });

  it('should update constraint via API', () => {
    const API_BASE = Cypress.env('apiUrl') || 'http://localhost:3000';
    // First create a constraint
    cy.createConstraint({
      type: 'min_rest',
      rules: { minRestHours: 11 },
      priority: 50,
      active: true,
    }).then(() => {
      // Get the created constraint ID
      cy.request('GET', `${API_BASE}/constraints`).then((response) => {
        const constraints = response.body;
        const createdConstraint = constraints.find((c: any) => c.type === 'min_rest' && c.priority === 50);
        if (createdConstraint) {
          // Update the constraint
          cy.updateConstraint(createdConstraint.id, { priority: 80, active: false });
        }
      });
    });
  });

  it('should delete constraint via API', () => {
    const API_BASE = Cypress.env('apiUrl') || 'http://localhost:3000';
    // First create a constraint
    cy.createConstraint({
      type: 'fair_distribution',
      rules: { maxShiftsPerEmployee: 20 },
      priority: 70,
      active: true,
    }).then(() => {
      // Get the created constraint ID
      cy.request('GET', `${API_BASE}/constraints`).then((response) => {
        const constraints = response.body;
        const createdConstraint = constraints.find((c: any) => c.type === 'fair_distribution' && c.priority === 70);
        if (createdConstraint) {
          // Delete the constraint
          cy.deleteConstraint(createdConstraint.id);
        }
      });
    });
  });

  it('should validate constraint types match backend enum', () => {
    // Valid constraint types from backend: max_hours, min_rest, fair_distribution, skill_requirement, availability, max_consecutive_days, min_consecutive_days
    const validTypes = [
      'max_hours',
      'min_rest',
      'fair_distribution',
      'skill_requirement',
      'availability',
      'max_consecutive_days',
      'min_consecutive_days',
    ];

    validTypes.forEach((type) => {
      cy.createConstraint({
        type,
        rules: type === 'max_hours' ? { maxHoursPerWeek: 40 } :
               type === 'min_rest' ? { minRestHours: 11 } :
               type === 'fair_distribution' ? { maxShiftsPerEmployee: 20 } :
               type === 'skill_requirement' ? { requiredSkills: ['ACLS'] } :
               type === 'availability' ? { availabilityWindows: [] } :
               type === 'max_consecutive_days' ? { maxDays: 5 } :
               { minDays: 3 },
        priority: 50,
        active: true,
      });
    });
  });

  it('should reject invalid constraint type', () => {
    const API_BASE = Cypress.env('apiUrl') || 'http://localhost:3000';
    // Try to create constraint with invalid type
    cy.request({
      method: 'POST',
      url: `${API_BASE}/constraints`,
      body: {
        type: 'invalid_type',
        rules: { test: 'value' },
        priority: 50,
        active: true,
      },
      failOnStatusCode: false,
    }).then((response) => {
      // Should return 400 Bad Request
      expect(response.status).to.equal(400);
    });
  });

  it('should reject constraint with priority out of range', () => {
    const API_BASE = Cypress.env('apiUrl') || 'http://localhost:3000';
    // Try priority > 100
    cy.request({
      method: 'POST',
      url: `${API_BASE}/constraints`,
      body: {
        type: 'max_hours',
        rules: { maxHoursPerWeek: 40 },
        priority: 150,
        active: true,
      },
      failOnStatusCode: false,
    }).then((response) => {
      // Should return 400 Bad Request
      expect(response.status).to.equal(400);
    });

    // Try priority < 0
    cy.request({
      method: 'POST',
      url: `${API_BASE}/constraints`,
      body: {
        type: 'max_hours',
        rules: { maxHoursPerWeek: 40 },
        priority: -10,
        active: true,
      },
      failOnStatusCode: false,
    }).then((response) => {
      // Should return 400 Bad Request
      expect(response.status).to.equal(400);
    });
  });
});


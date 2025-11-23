describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate to all main sections', () => {
    // Navigate to Scheduler
    cy.contains('Scheduler').click();
    cy.url().should('include', '/app/scheduler');
    cy.get('h2').contains('Schedule View').should('be.visible');
    
    // Navigate to Employees
    cy.contains('Employees').click();
    cy.url().should('include', '/app/employees');
    cy.get('h2').contains('Employee Management').should('be.visible');
    
    // Navigate to Constraints
    cy.contains('Constraints').click();
    cy.url().should('include', '/app/constraints');
    cy.get('h2').contains('Constraint Management').should('be.visible');
    
    // Navigate to Optimization
    cy.contains('Optimization').click();
    cy.url().should('include', '/app/optimization');
    cy.get('h2').contains('Schedule Optimization').should('be.visible');
  });

  it('should highlight active navigation item', () => {
    // Check Scheduler is active when on scheduler page
    cy.visit('/app/scheduler');
    cy.get('a[href="/app/scheduler"]').should('have.class', 'bg-primary-100');
    
    // Check Employees is active when on employees page
    cy.visit('/app/employees');
    cy.get('a[href="/app/employees"]').should('have.class', 'bg-primary-100');
  });

  it('should be responsive on mobile', () => {
    // Set mobile viewport
    cy.viewport(375, 667);
    
    // Verify navigation is still accessible
    cy.contains('Scheduler').should('be.visible');
    cy.contains('Employees').should('be.visible');
    
    // Navigation should work on mobile
    cy.contains('Employees').click();
    cy.url().should('include', '/app/employees');
  });
});


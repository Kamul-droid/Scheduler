// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('fail', (error, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions from the app
  if (error.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  throw error;
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err) => {
  // Ignore ResizeObserver errors
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  // Ignore other known non-critical errors
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});


// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  // Disable service workers
  if (win.navigator && 'serviceWorker' in win.navigator) {
    win.navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on uncaught exceptions
  return false;
});

// Custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      createWhatsAppInstance(name: string): Chainable<void>;
      connectWhatsAppInstance(instanceId: string): Chainable<void>;
    }
  }
}

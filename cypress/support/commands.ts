// Custom commands for Cypress

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type(email);
    cy.get('[data-cy=password-input]').type(password);
    cy.get('[data-cy=login-button]').click();
    cy.url().should('not.include', '/login');
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=user-menu]').click();
  cy.get('[data-cy=logout-button]').click();
  cy.url().should('include', '/login');
});

// Create WhatsApp instance command
Cypress.Commands.add('createWhatsAppInstance', (name: string) => {
  cy.visit('/whatsapp');
  cy.get('[data-cy=create-instance-button]').click();
  cy.get('[data-cy=instance-name-input]').type(name);
  cy.get('[data-cy=create-instance-submit]').click();
  cy.get('[data-cy=instance-list]').should('contain', name);
});

// Connect WhatsApp instance command
Cypress.Commands.add('connectWhatsAppInstance', (instanceId: string) => {
  cy.get(`[data-cy=instance-${instanceId}]`).within(() => {
    cy.get('[data-cy=connect-button]').click();
  });
  cy.get('[data-cy=qr-code]').should('be.visible');
});

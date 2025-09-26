describe('WhatsApp Integration', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('/whatsapp');
  });

  it('should display WhatsApp instances list', () => {
    cy.get('[data-cy=instances-list]').should('be.visible');
  });

  it('should create new WhatsApp instance', () => {
    cy.createWhatsAppInstance('Test Instance');
    cy.get('[data-cy=instances-list]').should('contain', 'Test Instance');
  });

  it('should connect WhatsApp instance', () => {
    cy.createWhatsAppInstance('Test Instance');
    cy.get('[data-cy=instance-Test Instance]').within(() => {
      cy.get('[data-cy=connect-button]').click();
    });
    cy.get('[data-cy=qr-code]').should('be.visible');
  });

  it('should send message', () => {
    cy.createWhatsAppInstance('Test Instance');
    cy.connectWhatsAppInstance('Test Instance');
    
    // Wait for connection
    cy.get('[data-cy=instance-status]').should('contain', 'connected');
    
    // Send message
    cy.get('[data-cy=message-input]').type('Hello World');
    cy.get('[data-cy=send-button]').click();
    cy.get('[data-cy=messages-list]').should('contain', 'Hello World');
  });

  it('should disconnect instance', () => {
    cy.createWhatsAppInstance('Test Instance');
    cy.connectWhatsAppInstance('Test Instance');
    
    cy.get('[data-cy=instance-Test Instance]').within(() => {
      cy.get('[data-cy=disconnect-button]').click();
    });
    
    cy.get('[data-cy=instance-status]').should('contain', 'disconnected');
  });

  it('should delete instance', () => {
    cy.createWhatsAppInstance('Test Instance');
    
    cy.get('[data-cy=instance-Test Instance]').within(() => {
      cy.get('[data-cy=delete-button]').click();
    });
    
    cy.get('[data-cy=confirm-delete]').click();
    cy.get('[data-cy=instances-list]').should('not.contain', 'Test Instance');
  });
});

describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should redirect to login page when not authenticated', () => {
    cy.url().should('include', '/login');
  });

  it('should login with valid credentials', () => {
    cy.login('test@example.com', 'password123');
    cy.url().should('not.include', '/login');
    cy.get('[data-cy=user-menu]').should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type('invalid@example.com');
    cy.get('[data-cy=password-input]').type('wrongpassword');
    cy.get('[data-cy=login-button]').click();
    cy.get('[data-cy=error-message]').should('be.visible');
  });

  it('should register new user', () => {
    cy.visit('/register');
    cy.get('[data-cy=name-input]').type('Test User');
    cy.get('[data-cy=email-input]').type('newuser@example.com');
    cy.get('[data-cy=password-input]').type('password123');
    cy.get('[data-cy=confirm-password-input]').type('password123');
    cy.get('[data-cy=register-button]').click();
    cy.url().should('not.include', '/register');
  });

  it('should logout user', () => {
    cy.login('test@example.com', 'password123');
    cy.logout();
    cy.url().should('include', '/login');
  });
});

/**
 * Cypress E2E Tests for Chatbot Widget
 */

describe('Chatbot Widget', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('http://localhost:3000');
    
    // Clear localStorage to start fresh
    cy.clearLocalStorage();
  });

  describe('Widget Visibility and Interaction', () => {
    it('should display the floating chat button', () => {
      cy.get('.chat-widget-button')
        .should('be.visible')
        .and('contain', '💬');
    });

    it('should open the chat drawer when button is clicked', () => {
      cy.get('.chat-widget-button').click();
      
      cy.get('.chat-widget-drawer')
        .should('be.visible');
      
      cy.get('.chat-widget-header h2')
        .should('contain', 'KimuntuX Assistant');
    });

    it('should close the drawer when close button is clicked', () => {
      cy.get('.chat-widget-button').click();
      cy.get('.chat-widget-close').click();
      
      cy.get('.chat-widget-drawer').should('not.exist');
    });

    it('should close the drawer when Escape key is pressed', () => {
      cy.get('.chat-widget-button').click();
      cy.get('body').type('{esc}');
      
      cy.get('.chat-widget-drawer').should('not.exist');
    });
  });

  describe('Welcome Message', () => {
    it('should display a welcome message when opened', () => {
      cy.get('.chat-widget-button').click();
      
      cy.get('.chat-message-bot')
        .first()
        .should('contain', 'Welcome to KimuntuX Assistant');
    });
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      cy.get('.chat-widget-button').click();
    });

    it('should send a message when user types and clicks send', () => {
      const testMessage = 'What is KimuntuX?';
      
      cy.get('.chat-widget-input')
        .type(testMessage);
      
      cy.get('.chat-widget-send').click();
      
      // User message should appear
      cy.get('.chat-message-user')
        .last()
        .should('contain', testMessage);
      
      // Bot should respond
      cy.get('.chat-message-bot', { timeout: 5000 })
        .should('have.length.greaterThan', 1); // More than just welcome message
    });

    it('should send a message when user presses Enter', () => {
      const testMessage = 'How much does it cost?';
      
      cy.get('.chat-widget-input')
        .type(testMessage + '{enter}');
      
      cy.get('.chat-message-user')
        .last()
        .should('contain', testMessage);
    });

    it('should not send empty messages', () => {
      cy.get('.chat-widget-send').should('be.disabled');
      
      cy.get('.chat-widget-input').type('   ');
      cy.get('.chat-widget-send').should('be.disabled');
    });

    it('should show typing indicator while waiting for response', () => {
      cy.get('.chat-widget-input').type('Test message{enter}');
      
      // Typing indicator should appear briefly
      cy.get('.typing-indicator').should('be.visible');
    });
  });

  describe('FAQ Matching', () => {
    beforeEach(() => {
      cy.get('.chat-widget-button').click();
    });

    it('should answer common questions about KimuntuX', () => {
      cy.get('.chat-widget-input').type('What is KimuntuX?{enter}');
      
      cy.get('.chat-message-bot', { timeout: 5000 })
        .last()
        .should('contain', 'AI-driven brokerage');
    });

    it('should provide pricing information', () => {
      cy.get('.chat-widget-input').type('How much does it cost?{enter}');
      
      cy.get('.chat-message-bot', { timeout: 5000 })
        .last()
        .should('contain', '$99');
    });
  });

  describe('Lead Qualification Flow', () => {
    beforeEach(() => {
      cy.get('.chat-widget-button').click();
      
      // Stub the lead creation to avoid actual API calls
      cy.window().then((win) => {
        cy.stub(win.localStorage, 'setItem').as('localStorageSet');
      });
    });

    it('should collect user information step by step', () => {
      // Start qualification flow
      cy.get('.chat-widget-input').type('My name is John Doe{enter}');
      
      cy.get('.chat-message-bot', { timeout: 5000 })
        .last()
        .should('contain', 'email');
      
      // Provide email
      cy.get('.chat-widget-input').type('john@example.com{enter}');
      
      cy.get('.chat-message-bot', { timeout: 5000 })
        .last()
        .should('contain', 'role');
      
      // Provide role
      cy.get('.chat-widget-input').type('CEO{enter}');
      
      cy.get('.chat-message-bot', { timeout: 5000 })
        .last()
        .should('contain', 'budget');
      
      // Provide budget
      cy.get('.chat-widget-input').type('$5000{enter}');
      
      cy.get('.chat-message-bot', { timeout: 5000 })
        .last()
        .should('contain', 'timeline');
      
      // Provide timeline
      cy.get('.chat-widget-input').type('2 weeks{enter}');
      
      // Should receive qualification result
      cy.get('.chat-message-bot', { timeout: 5000 })
        .last()
        .should('match', /(high-priority|reach out|contact)/i);
    });

    it('should emit lead_qualified event when lead is created', () => {
      let leadQualifiedEvent = null;
      
      cy.window().then((win) => {
        win.addEventListener('kimuntu:lead_qualified', (e) => {
          leadQualifiedEvent = e.detail;
        });
      });
      
      // Complete qualification flow quickly
      cy.get('.chat-widget-input').type('John Doe{enter}');
      cy.wait(500);
      cy.get('.chat-widget-input').type('john@example.com{enter}');
      cy.wait(500);
      cy.get('.chat-widget-input').type('Founder{enter}');
      cy.wait(500);
      cy.get('.chat-widget-input').type('$10000{enter}');
      cy.wait(500);
      cy.get('.chat-widget-input').type('ASAP{enter}');
      cy.wait(1000);
      
      cy.window().then(() => {
        expect(leadQualifiedEvent).to.not.be.null;
        expect(leadQualifiedEvent.score).to.be.oneOf(['HOT', 'WARM', 'COLD']);
      });
    });
  });

  describe('Handoff Flow', () => {
    beforeEach(() => {
      cy.get('.chat-widget-button').click();
    });

    it('should handle handoff request', () => {
      cy.get('.chat-widget-input').type('I want to talk to a human{enter}');
      
      cy.get('.chat-message-bot', { timeout: 5000 })
        .last()
        .should('contain', 'connect you with a human agent');
    });

    it('should emit handoff_requested event', () => {
      let handoffEvent = null;
      
      cy.window().then((win) => {
        win.addEventListener('kimuntu:handoff_requested', (e) => {
          handoffEvent = e;
        });
      });
      
      cy.get('.chat-widget-input').type('talk to support{enter}');
      cy.wait(1000);
      
      cy.window().then(() => {
        expect(handoffEvent).to.not.be.null;
      });
    });
  });

  describe('Context Awareness', () => {
    it('should use different context for different pages', () => {
      // Visit CRM page
      cy.visit('http://localhost:3000/crm');
      cy.get('.chat-widget-button').click();
      
      cy.get('.chat-message-bot')
        .first()
        .should('contain', 'crm');
      
      // Visit campaigns page
      cy.visit('http://localhost:3000/affiliate-hub');
      cy.get('.chat-widget-button').click();
      
      cy.get('.chat-message-bot')
        .first()
        .should('contain', 'campaigns');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      cy.get('.chat-widget-button').click();
    });

    it('should prevent spam by rate limiting', () => {
      // Send 4 messages quickly
      for (let i = 0; i < 4; i++) {
        cy.get('.chat-widget-input').type(`Message ${i}{enter}`);
        cy.wait(100);
      }
      
      // Should see rate limit message
      cy.get('.chat-message-bot', { timeout: 5000 })
        .last()
        .should('match', /(slow down|3 messages)/i);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      // Tab to button
      cy.get('body').tab();
      cy.focused().should('have.class', 'chat-widget-button');
      
      // Enter to open
      cy.focused().type('{enter}');
      cy.get('.chat-widget-drawer').should('be.visible');
      
      // Input should be focused
      cy.get('.chat-widget-input').should('be.focused');
    });

    it('should have proper ARIA attributes', () => {
      cy.get('.chat-widget-button')
        .should('have.attr', 'aria-label')
        .and('include', 'chat');
      
      cy.get('.chat-widget-button').click();
      
      cy.get('.chat-widget-drawer')
        .should('have.attr', 'role', 'dialog')
        .and('have.attr', 'aria-label');
      
      cy.get('.chat-message-bot')
        .first()
        .should('have.attr', 'aria-live', 'polite');
    });
  });

  describe('Session Persistence', () => {
    it('should maintain sessionId across page reloads', () => {
      cy.get('.chat-widget-button').click();
      cy.get('.chat-widget-input').type('Test message{enter}');
      cy.wait(1000);
      
      // Get sessionId from localStorage
      cy.window().then((win) => {
        const sessionId = win.localStorage.getItem('kimuntu_chat_session_id');
        expect(sessionId).to.not.be.null;
        
        // Reload page
        cy.reload();
        
        // Session should persist
        cy.window().then((newWin) => {
          const newSessionId = newWin.localStorage.getItem('kimuntu_chat_session_id');
          expect(newSessionId).to.equal(sessionId);
        });
      });
    });
  });
});

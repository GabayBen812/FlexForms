describe("Form Registration", () => {
  const testFormCode = "834751";

  beforeEach(() => {
    cy.visit(`/forms/${testFormCode}/registration`);
  });

  it.skip("loads the form and displays all required elements", () => {
    cy.get('[data-cy="registration-form"]').should("be.visible");
    cy.get('[data-cy="form-title"]').should("be.visible");
    cy.get('[data-cy="field-container-fullName"]').should("be.visible");
    cy.get('[data-cy="field-container-email"]').should("be.visible");
    cy.get('[data-cy="field-container-phone"]').should("be.visible");
  });

  it.skip("validates required fields", () => {
    // Submit empty form
    cy.get('[data-cy="submit-button"]').click();
    
    // Check that field containers show error styling
    cy.get('[data-cy="field-container-fullName"]').should("have.class", "border-red-500");
    cy.get('[data-cy="field-container-email"]').should("have.class", "border-red-500"); 
    cy.get('[data-cy="field-container-phone"]').should("have.class", "border-red-500");
  });

  it.skip("validates email format", () => {
    cy.get('[data-cy="field-input-email"]').type("invalid-email");
    cy.get('[data-cy="submit-button"]').click();
    // Check that error message is visible for invalid email
    cy.get('[data-cy="field-error-email"]').should("be.visible");
  });

  it.only("validates phone number format", () => {
    cy.get('[data-cy="field-input-fullName"]').type("משתמש טסט");
    cy.get('[data-cy="field-input-email"]').type("test@email.com");
    cy.get('[data-cy="field-input-phone"]').type("123"); // Too short
    cy.get('[data-cy="submit-button"]').click();
    cy.get('[data-cy="field-error-phone"]').should("be.visible");
  });

  it("successfully submits form with valid data", () => {
    // Fill in required fields
    cy.get('[data-cy="field-input-fullName"]').type("משתמש טסט");
    cy.get('[data-cy="field-input-email"]').type("test@email.com");
    cy.get('[data-cy="field-input-phone"]').type("0501234567");
    
    // Handle checkbox if present
    cy.get('[data-cy^="field-checkbox-"]').then(($checkbox) => {
      if ($checkbox.length > 0) {
        cy.wrap($checkbox).check();
      }
    });
    
    // Handle select if present
    cy.get('[data-cy^="field-select-"]').then(($select) => {
      if ($select.length > 0) {
        cy.wrap($select).select(1);
      }
    });

    // Handle signature if present
    cy.get('[data-cy^="field-signature-canvas-"]').then(($canvas) => {
      if ($canvas.length > 0) {
        cy.wrap($canvas).click(150, 75).click(200, 100);
      }
    });

    // Handle terms if present
    cy.get('[data-cy^="field-terms-checkbox-"]').then(($checkbox) => {
      if ($checkbox.length > 0) {
        cy.wrap($checkbox).check();
      }
    });
    
    cy.get('[data-cy="submit-button"]').click();
    cy.contains("ההרשמה בוצעה בהצלחה").should("exist");
  });

  it("handles server error gracefully", () => {
    // Intercept the form submission and force an error
    cy.intercept("POST", "/registrations", {
      statusCode: 500,
      body: { message: "Server error" }
    }).as("submitForm");

    cy.get('[data-cy="field-input-fullName"]').type("משתמש טסט");
    cy.get('[data-cy="field-input-email"]').type("test@email.com");
    cy.get('[data-cy="field-input-phone"]').type("0501234567");
    cy.get('[data-cy="submit-button"]').click();

    cy.wait("@submitForm");
    cy.contains("registration_fail").should("be.visible");
  });

  it("preserves form data after validation error", () => {
    cy.get('[data-cy="field-input-fullName"]').type("משתמש טסט");
    cy.get('[data-cy="field-input-email"]').type("invalid-email");
    cy.get('[data-cy="field-input-phone"]').type("0501234567");
    
    cy.get('[data-cy="submit-button"]').click();
    
    // Verify data is preserved
    cy.get('[data-cy="field-input-fullName"]').should("have.value", "משתמש טסט");
    cy.get('[data-cy="field-input-email"]').should("have.value", "invalid-email");
    // Phone is now formatted with dashes
    cy.get('[data-cy="field-input-phone"]').should("have.value", "050-123-4567");
  });

  it("handles dynamic fields correctly", () => {
    // Test select field if present
    cy.get('[data-cy^="field-select-"]').then(($select) => {
      if ($select.length > 0) {
        cy.wrap($select).select(1);
        cy.wrap($select).should("have.value", "1");
      }
    });

    // Test checkbox field if present
    cy.get('[data-cy^="field-checkbox-"]').then(($checkbox) => {
      if ($checkbox.length > 0) {
        cy.wrap($checkbox).check();
        cy.wrap($checkbox).should("be.checked");
      }
    });

    // Test signature field if present
    cy.get('[data-cy^="field-signature-canvas-"]').then(($canvas) => {
      if ($canvas.length > 0) {
        cy.wrap($canvas).click(150, 75).click(200, 100);
        cy.get('[data-cy^="field-signature-clear-"]').click();
        // Verify canvas is cleared
        cy.wrap($canvas).should("be.visible");
      }
    });

    // Test terms field if present
    cy.get('[data-cy^="field-terms-"]').then(($terms) => {
      if ($terms.length > 0) {
        cy.get('[data-cy^="field-terms-text-"]').should("be.visible");
        cy.get('[data-cy^="field-terms-checkbox-"]').check();
        cy.get('[data-cy^="field-terms-checkbox-"]').should("be.checked");
      }
    });
  });
});

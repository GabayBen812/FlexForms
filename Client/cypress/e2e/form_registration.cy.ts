describe("Form Registration", () => {
  const testFormCode = "834751";

  beforeEach(() => {
    cy.visit(`/forms/${testFormCode}/registration`);
  })

  it("loads the form and submits successfully", () => {
    cy.contains("הרשמה לטופס").should("be.visible");
  });

  it.only("fills full dynamic form and submits", () => {  
    cy.get('input[name="fullName"]').type("משתמש טסט");
    cy.get('input[name="email"]').type("test@email.com");
    cy.get('input[name="phone"]').type("0501234567");
  
    cy.get('input[type="checkbox"]').check();
  
    cy.get("select").first().select(1);
  
    cy.get("form").submit();
  
    cy.contains("ההרשמה בוצעה בהצלחה").should("exist");
  });
  
});

/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
describe('Login test', () => {
  it('basic Login', () => {
    // cy.login("menu pretty waste little skill copper main absorb bacon still deliver finish");
    // cy.visit(Cypress.env("host"));
    // cy.get_e2e("createMeetingBtn").click();
    //cy.login("menu pretty waste little skill copper main absorb bacon still deliver finish");
    cy.register_users(1,1,1).then(users => {
      const admin_mnemoic = users.admins[0].mnemonic;
      const admin_name = users.admins[0].field1;

      cy.login(admin_mnemoic);
      cy.visit("http://localhost:3999/app")
      cy.create_meeting("Vorstand")
      cy.get_e2e("meetingCard").first().click();
      // cy.log(value);
      let date_id = Date.now()
      const date_id_1 = date_id + 1
      cy.log(date_id_1)
      cy.create_vote(date_id_1, false)
      cy.get_e2e("voteCard").should("contain", date_id_1)

      cy.toggle_meeting_dropdown("openRegistrationDropdownEntry");

      cy.toggle_meeting_dropdown("toggleVisibilityDropdownEntry", "einblenden");

      cy.register()

      cy.toggle_meeting_dropdown("openMeetingDropdownEntry");
      cy.get(".d-none").contains("Abstimmungen").click();

      cy.get_e2e("openVoteButton").click();
      cy.get_e2e("confirmation-modal-button-confirm").click();
      cy.set_vote(date_id_1, "Nein")

      cy.end_and_verify_vote(date_id_1, admin_name)

      cy.toggle_meeting_dropdown("closeMeetingDropdownEntry")
      cy.toggle_meeting_dropdown("toggleVisibilityDropdownEntry", "ausblenden")
    });

  })
})

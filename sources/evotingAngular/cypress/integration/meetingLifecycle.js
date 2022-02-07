/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
describe('Create and remove meeting', () => {
  it('basic Login', () => {
    cy.register_users(1,0,0).then(users => {
      const admin_mnemonic = users.admins[0].mnemonic;
      cy.login(admin_mnemonic);
      cy.visit("http://localhost:3999/app")

      // Create meeting and delete meeting
      cy.create_meeting("Vorstand")
      cy.get_e2e("meetingCard").first().click();

      cy.toggle_meeting_dropdown("openRegistrationDropdownEntry");
      cy.toggle_meeting_dropdown("toggleVisibilityDropdownEntry", "einblenden");
      cy.toggle_meeting_dropdown("closeRegistrationDropdownEntry");
      cy.toggle_meeting_dropdown("deleteMeetingModalButton");

      cy.get_e2e("createMeetingBtn").should("exist")
      cy.get_e2e("meetingCard").should("not.exist")

      // Create meeting, register, and close meeting
      cy.create_meeting("Vorstand")
      cy.get_e2e("meetingCard").should("exist")
      cy.get_e2e("meetingCard").first().click();

      cy.toggle_meeting_dropdown("openRegistrationDropdownEntry");
      cy.register()
      cy.toggle_meeting_dropdown("toggleVisibilityDropdownEntry", "einblenden");
      cy.get_e2e("visibilityInfoBanner").should("not.exist")
      cy.toggle_meeting_dropdown("openMeetingDropdownEntry");
      cy.toggle_meeting_dropdown("closeRegistrationDropdownEntry");
      cy.toggle_meeting_dropdown("closeMeetingDropdownEntry")
      cy.toggle_meeting_dropdown("toggleVisibilityDropdownEntry", "ausblenden")
      cy.get_e2e("visibilityInfoBanner").should("exist")

      cy.get_e2e("backToGeneralMeetingButton").click()
      cy.get_e2e("meetingCard").should("have.length", 1)
    });
  })
})

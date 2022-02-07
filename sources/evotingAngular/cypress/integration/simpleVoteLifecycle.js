/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
describe('Create and remove meeting', () => {
  it('basic Login', () => {
    cy.register_users(1,0,0).then(users => {
      const admin_mnemonic = users.admins[0].mnemonic;
      const admin_name = users.admins[0].field1;
      cy.login(admin_mnemonic);
      cy.visit("http://localhost:3999/app")

      // Create meeting and delete meeting
      cy.create_meeting("Vorstand")
      cy.get_e2e("meetingCard").first().click();

      cy.toggle_meeting_dropdown("openRegistrationDropdownEntry");
      cy.register()
      cy.toggle_meeting_dropdown("toggleVisibilityDropdownEntry", "einblenden");

      let date_id = Date.now()
      const date_id_1 = date_id + 1
      cy.log(date_id_1)
      cy.create_vote(date_id_1, false)
      cy.get_e2e("voteCard").should("contain", date_id_1)
      const new_title = " This title has been edited"
      cy.check_vote_buttons(admin_name, new_title)
      cy.get_e2e("voteCard").should("contain", date_id_1 + new_title)

      cy.get_e2e("openDeleteVoteModalButton").click()
      cy.get_e2e("deleteVoteButton").click()
      cy.get_e2e("voteCard").should("not.exist")

      // open meeting
      cy.toggle_meeting_dropdown("openMeetingDropdownEntry");

      /*Create anonymous vote and run voting*/
      const date_id_2 = date_id_1 + 1
      cy.create_vote(date_id_2, true)
      cy.get_e2e("openVoteButton").click();
      cy.get_e2e("confirmation-modal-button-confirm").click();
      cy.set_vote(date_id_2, "Ja")


      /*open new vote and archive it*/
      const date_id_3 = date_id_2 + 1
      cy.create_vote(date_id_3, false)
      cy.archive_vote(date_id_3)

      /*count votes and close meeting*/
      cy.end_and_verify_vote(date_id_2, true, admin_name)
      cy.get_e2e("closeMeetingInfoBanner",{timedOut: 10000}).should("not.exist")
    });
  })
})

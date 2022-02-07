/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
describe("Create and Edit Vote",() => {
  it("reset Users", () => {
    cy.register_users(1,2,1).then(users => {
      cy.log(users)
      // getting all user infos
      const admin_mnemonic = users.admins[0].mnemonic;
      const admin_name = users.admins[0].field1;
      const member1_mnemonic = users.members[0].mnemonic;
      const member1_name = users.members[0].field1;
      const member2_mnemonic = users.members[1].mnemonic;
      const member2_name = users.members[1].field1;
      const guest_mnemonic = users.guests[0].mnemonic;

      // Creating a new meeting with chairperson "Vorstand" and a new vote
      cy.login(admin_mnemonic);
      cy.visit("http://localhost:3999/app")
      cy.create_meeting("Vorstand", true)
      cy.get_e2e("meetingCard").first().click();

      let date_id = Date.now()
      const date_id_1 = date_id + 1
      cy.log(date_id_1)
      cy.create_vote(date_id_1, false, true)
      cy.get_e2e("voteCard").should("contain", date_id_1)
      const new_title = " This title has been edited"
      cy.check_vote_buttons(admin_name, new_title)
      cy.get_e2e("voteCard").should("contain", date_id_1 + new_title)

      // Open meeting registration and change visibility
      cy.toggle_meeting_dropdown("openRegistrationDropdownEntry");

      cy.toggle_meeting_dropdown("toggleVisibilityDropdownEntry", "einblenden");

      cy.register()

      // check authorisation tap and give vote authority from admin to member1
      cy.set_authority(admin_name, admin_name)
      cy.set_authority(admin_name, member1_name)

      // create new authority and delete previous authority
      cy.set_authority(member2_name, member1_name)
      cy.get_e2e("deleteAuthorityButton").eq(0).click()
      cy.get_e2e("authoritiesListItem").contains(admin_name).should("not.exist")

      // open meeting
      cy.toggle_meeting_dropdown("openMeetingDropdownEntry");
      cy.get(".d-none").contains("Abstimmungen").click();


      // login to guest and member2 account and check if they can only see but not participate in vote
      cy.login(guest_mnemonic)
      cy.checkVisibility();

      cy.login(member2_mnemonic)
      cy.checkVisibility();

      // login to member1 account and register for meeting
      cy.login(member1_mnemonic)
      cy.reload()
      cy.register();
      cy.get_e2e("AuthorityOverviewButton").should("not.exist");
      cy.get(".d-none").contains("Teilnehmer").click();

      /*open vote and set vote "Nein"*/
      cy.login(admin_mnemonic);
      cy.reload()
      cy.get_e2e("openVoteButton").click();
      cy.get_e2e("confirmation-modal-button-confirm").click();
      cy.set_vote(date_id_1, "Nein")


      /*open vote and set vote=Ja for both voting rights*/
      cy.login(member1_mnemonic)
      cy.reload()
      cy.set_multiple_votes(date_id_1, "Ja")


      /*Create anonymous vote and run voting*/
      cy.login(admin_mnemonic)
      cy.reload()
      const date_id_2 = date_id_1 + 1
      cy.create_vote(date_id_2, true)
      cy.get_e2e("openVoteButton").click();
      cy.get_e2e("confirmation-modal-button-confirm").click();
      cy.set_vote(date_id_2, "Ja")

      /*open vote and set both voting rights*/
      cy.login(member1_mnemonic)
      cy.reload()
      cy.set_multiple_votes(date_id_2, "Ja")


      cy.login(admin_mnemonic)
      cy.reload()

      /*open new vote and archive it*/
      const date_id_3 = date_id_2 + 1
      cy.create_vote(date_id_3, false)
      cy.archive_vote(date_id_3)

      /*count votes and close meeting*/
      cy.end_and_verify_vote(date_id_1, false, admin_name)
      cy.get_e2e("closeMeetingInfoBanner").should("exist")
      cy.end_and_verify_vote(date_id_2, true, admin_name)
      cy.get_e2e("closeMeetingInfoBanner",{timedOut: 10000}).should("not.exist")
      cy.toggle_meeting_dropdown("closeMeetingDropdownEntry")
      cy.toggle_meeting_dropdown("toggleVisibilityDropdownEntry", "ausblenden")

      /*check if member can't see meeting anymore*/
      cy.login(member1_mnemonic)
      cy.visit("http://localhost:3999/app")
      cy.get_e2e("meetingCard").should("not.exist")
    })
  })
});

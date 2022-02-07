/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import * as CryptoJS from 'crypto-js';
import {getFakeUsers} from "./fakeUser";
import {getMultiDataParams} from "./storageUtil";
import {resetWithUsers} from "./blockchain";
import 'cypress-file-upload';

Cypress.Commands.add("login", (mnemonic) => {
  cy.log("Login with mnemonic: " + mnemonic);
  sessionStorage.setItem("decentravote-mnemonic", mnemonic);
  const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, 'Test1234!').toString();
  localStorage.setItem("decentravote-mnemonic", encryptedMnemonic);
})

Cypress.Commands.add('get_e2e', (selector, ...args) => {
  return cy.get(`[data-e2e=${selector}]`, ...args);
})

Cypress.Commands.add("register_users", (numberOfAdmins, numberOfMembers, numberOfGuests, ...args) => {
  let users = getFakeUsers(numberOfAdmins, numberOfMembers, numberOfGuests);
  let params = getMultiDataParams(users);
  return cy.request({
    body: params.body,
    headers: params.headers,
    url: Cypress.env("storage_url") + "/api/e2e/save",
    method: "POST"
  }).then(async (response) => {
    return cy.wrap(resetWithUsers(users));
  }).then(async (response) => {
    return cy.request({
      url: Cypress.env("ballotbox_url") + "/api/e2e/resetEventManager"
    });
    }
  ).then( () => {
    return users;
  });
})

Cypress.Commands.add("checkVisibility", () => {
  cy.reload()
  cy.get_e2e("voteCard").should("exist")
  cy.get_e2e("registerForMeetingButton").should("not.exist")
  cy.get_e2e("AuthorityOverviewButton").should("not.exist")
})

/*This command expects the status of the chairperson: "Vorstand", "Mitglied" or "Gast"*/
Cypress.Commands.add("create_meeting", (chair_person, title_length_test=false) => {
  cy.get_e2e("createMeetingBtn").click();
  cy.get_e2e("createMeetingButton").should("be.disabled")
  cy.get_e2e("meetingTitleInput").type("Test Versammlung")
  cy.get_e2e("chairpersonExpandListButton").click();
  cy.get(`[data-e2e=memberListEntry]`).its("length").should("to.be.at.least", 1);
  cy.get('.ev-member-list > .list-group').within( () => {
    function set_chair (role) {
      cy.get_e2e(role).first().click({force: true})
    }
    switch (chair_person){
      case "Mitglied":
        set_chair("MemberBadge");
        break;
      case "Vorstand":
        set_chair("DirectorBadge");
        break;
      case "Gast":
        set_chair("GuestBadge");
        break;
    }
  });
  cy.get_e2e("selectChairpersonButton").click();
  if(title_length_test) {
    cy.test_input_length("meetingTitleInput", "createMeetingButton", 100)
  }
  cy.get_e2e("createMeetingButton").click();
})

/*This command expects the type of input window: "Meeting", "Voting"; and date_id*/
Cypress.Commands.add("test_input_length", (input_field_name, confirm_button, max_length , date_id="None") => {
  cy.get_e2e(input_field_name).clear()
  cy.get_e2e(input_field_name).type("A".repeat(max_length + 1))
  cy.get_e2e(confirm_button).should("be.disabled")
  cy.get_e2e(input_field_name).type("{backspace}")
  cy.get_e2e(confirm_button).should("not.be.disabled")
  cy.get_e2e(input_field_name).clear()
  cy.get_e2e(input_field_name).type("Length test successful - " + date_id)
})

/*This command expects the date time (Date.now()) and a boolean for anonymous vote*/
Cypress.Commands.add("create_vote", (date_id, anonymous, title_length_test=false) => {
  cy.get_e2e("createVoteButton").click()
  cy.get_e2e("votingTitleInput").type("This is a vote title - " + date_id.toString())
  if(title_length_test) {
    cy.test_input_length("votingTitleInput", "createVoteModalButton", 200, date_id)
  }
  if(anonymous) {
    cy.get('input[id="anonymous"]').check({force: true})
  }
  cy.get_e2e("createVoteModalButton").click()
  cy.get_e2e("voteCard").should("contain", date_id)
  if(anonymous){
    cy.contains(date_id).parent().parent().should("contain", "visibility_off")
  }
})

Cypress.Commands.add("archive_vote", (date_id) => {
  cy.get_e2e("openArchiveVoteModal").click()
  cy.get_e2e("archiveVoteButton").should("be.disabled")
  cy.get_e2e("archiveReasonTextArea").type("Test Archive Message")
  cy.get_e2e("archiveVoteButton").click()
  cy.get_e2e("voteCard").contains(date_id).parent().parent().should("contain", "Archiviert")
})

Cypress.Commands.add("check_vote_buttons", (admin_name, new_title) => {
  // Test edit Vote Button
  cy.get_e2e("editVoteButton").click();
  cy.get_e2e("votingTitleInput").type(new_title)
  cy.get_e2e("createVoteModalButton").click()
  cy.get_e2e("voteCard").should("contain", new_title)

  // Test Participants Button
  cy.get_e2e("openParticipantsModalButton").click()
  cy.get_e2e("participantsList").should("contain", admin_name)
  cy.get("body").type('{esc}')

  // Test change request button
  cy.get_e2e("openChangeRequestModalButton").click()
  const change_request = " + Änderungsantrag"
  cy.get_e2e("votingTitleInput").type(change_request)
  cy.get_e2e("createVoteModalButton").click()
  cy.get_e2e("voteCard").should("contain", new_title + change_request)

  // Test delete vote button
  cy.get_e2e("openDeleteVoteModalButton").eq(1).click()
  cy.get_e2e("deleteVoteButton").click()
  cy.get_e2e("voteCard").eq(1).should("not.exist")
})


Cypress.Commands.add("set_vote", (date_id, vote_string) => {
  cy.contains(date_id).parent().parent().should("contain", "Stimmabgabe")
  cy.contains(date_id).click();
  cy.get_e2e("castVoteButton").should("be.disabled");
  cy.get(`input[id="option_${vote_string}"]`).check();
  cy.get_e2e("castVoteButton").click();
  cy.get_e2e("castVoteButton").should("be.disabled");
  cy.get_e2e("castVoteButton").should("contain", "Bereits abgestimmt");
  cy.get_e2e("closeVotingDetailModal").click();
})

Cypress.Commands.add("set_multiple_votes", (date_id, vote_string) => {
  cy.contains(date_id).parent().parent().should("contain", "Stimmabgabe")
  cy.contains(date_id).click();
  cy.get(".pl-2").then(votes => {
    const number_of_votes = parseInt(votes[0].innerText.slice(-1))
    for(let i = 1;i<=number_of_votes; i++) {
      cy.get_e2e("castVoteButton").should("be.disabled");
      cy.get(`input[id="option_${vote_string}"]`).check();
      cy.get_e2e("castVoteButton").click();
      cy.get_e2e("castVoteButton").should("be.disabled");
      if(i === number_of_votes){
        cy.get_e2e("castVoteButton").should("contain", "Bereits abgestimmt");
      } else {
        cy.get_e2e("voteArrowRightButton").click();
      }
    }
    cy.get_e2e("closeVotingDetailModal").click();
  })

})

Cypress.Commands.add("set_authority", (name_from, name_to) => {
  cy.get_e2e("AuthorityOverviewButton").click()
  cy.get_e2e("AuthoritiesListCreateAuthorityButton").click()
  function click_list_item(list, name){
    cy.get_e2e(list).children(['get_e2e="representativeListItem"']).contains(name).click()
  }
  if (name_from === name_to){
    click_list_item("representativeList", name_from)
    click_list_item("representeeList", name_to)
    cy.get_e2e("addAuthorityModalButton").should("be.disabled")
    cy.get_e2e("closeCreateAuthorityModal").click();
  } else {
    click_list_item("representativeList", name_from)
    click_list_item("representeeList", name_to)
    cy.get_e2e("addAuthorityModalButton").click()
    cy.get_e2e("authoritiesListItem").eq(0).should("exist")
  }
})

Cypress.Commands.add("toggle_meeting_dropdown", (entry, visibility=null) => {
  cy.get_e2e("meetingDropdownButton").click().then(option => {
    cy.wrap(option).get_e2e(entry).click({force: true})
    if(entry === "toggleVisibilityDropdownEntry"){
      if(visibility === "einblenden"){
        cy.wrap(option).get_e2e(entry).should("contain", "ausblenden")
      } else {
        cy.wrap(option).get_e2e(entry).should("contain", "einblenden")
      }
    }else if(entry === "openMeetingDropdownEntry"){
      cy.get_e2e("confirmation-modal-button-confirm").click()
      cy.wrap(option).get_e2e("closeMeetingDropdownEntry").should("exist")
    }else if(entry === "deleteMeetingModalButton"){
      cy.get_e2e("deleteMeetingButton").click()
    } else if (entry === "openRegistrationDropdownEntry"){
      cy.get_e2e("confirmation-modal-button-confirm").click()
    }
  })
})

Cypress.Commands.add("register", () => {
  cy.get_e2e("registerForMeetingButton").click();
  cy.get_e2e("registerForMeetingButton").should("not.exist");
})

Cypress.Commands.add("end_and_verify_vote", (date_id, anonymous, admin_name) => {
  cy.get_e2e("closeVoteButton").first().click();
  cy.get_e2e("finishVoteButton").click();
  cy.get_e2e("voteCard").should("contain", "Ausgezählt");
  cy.get_e2e("voteCard").contains(date_id).click();
  // cy.get_e2e("votingOption").should("contain", "1");
  if (!anonymous) {
    cy.get_e2e("voteVerificationDetail").click();
    cy.get_e2e("expandVoteDetailButton").click();
    cy.get_e2e("voteDetailExpansionPanel").should("contain", admin_name);
    cy.get_e2e("downloadVotingResultButton").click();
    cy.get_e2e("voteVerificationOverview").click();
  }
  cy.get_e2e("verifyVotesButton").click()
  cy.get_e2e("closeVotingDetailModal").click();
})

Cypress.Commands.add("import_users", () => {
  cy.get_e2e("manageMembersBtn").click()
  cy.get_e2e("importBtn").click()

  const userImports = 'user_import_small.json';
  cy.get_e2e("fileInput").attachFile(userImports);

  cy.get(`[id=userField0_2]`).clear()
  cy.get_e2e("importButton").should("be.disabled")
  cy.get_e2e("removeUserButton").eq(2).click(2)

  cy.get_e2e("importButton").click()
  cy.get_e2e("userAndImportedUserList").find('li').should('have.length', 5)
})

Cypress.Commands.add("import_existing_users", () => {
  cy.get_e2e("importBtn").click()
  const userImports = 'user_import_small.json';
  cy.get_e2e("fileInput").attachFile(userImports);

  cy.get(`[id=userField0_2]`).should("exist")
  cy.get_e2e("importButton").should("be.disabled")
  cy.get_e2e("dismissButton").click()
})


Cypress.Commands.add("manage_access_code",(userId) => {
  cy.wait(2000)
  cy.get_e2e("manageAccessCodeButton-" + userId).should('be.visible').click()

  cy.get_e2e("accessCode")
    .invoke("val")
    .then(accessCode => {
      cy.log(accessCode)

      cy.get_e2e("dismissButton").click()
      cy.get_e2e("backToGeneralMeetingButton").click()

      cy.get_e2e("accountDropdownButton").click()
      cy.get_e2e("logoutDropdownEntry").click({ force: true })

      cy.get_e2e("resetPasswordLink").click()
      cy.get_e2e("resetPasswordConfirmButton").click()

      cy.test_user_registration(accessCode)
    })
})

/*This command expects the access code of the user*/
Cypress.Commands.add("test_user_registration", (accessCode) => {
  let password = "asdfasdf1234"
  cy.get_e2e("getStartedBtn").click()
  cy.get_e2e("createAccountBtn").click()
  cy.get_e2e("createPasswordInp").type(password)
  cy.get_e2e("createPasswordConfirmInp").type(password)
  cy.get_e2e("createPasswordBtn").click()

  cy.get_e2e("mnemonicTextField")
    .invoke("val")
    .then(mnemonic => {
      cy.log(mnemonic)
      cy.get_e2e("createMnemonicBtn").click()

      cy.log(accessCode)
      cy.get_e2e("tokenInp").type(accessCode)

      cy.get_e2e("sendTokenBtn").click()
      cy.get_e2e("connectAccountButton").click()

      cy.get_e2e("accountDropdownButton").click()
      cy.get_e2e("showMnemonicDropdownEntry").click({ force: true })

      cy.get_e2e("mnemonicTextArea")
        .invoke("val")
        .then(mnemonic2 => {
          expect(mnemonic).equal(mnemonic2);
        })
    })
})

Cypress.Commands.add("edit_users", (userId) => {
  //cy.get_e2e("editUserButton-" + userId).should('exist')
  cy.get_e2e("editUserButton-" + userId).should('have.length', 1)
  cy.get_e2e("editUserButton-" + userId).click({ force: true })

  cy.get(`[formcontrolname=role]`).select("1")
  cy.get_e2e("submitEditButton").click()

  cy.get_e2e("deleteUserButton-" + userId).click({ force: true })
  cy.get_e2e("removeButton").click()
  cy.get_e2e("userAndImportedUserList").find('li').should('have.length', 4)
})

Cypress.Commands.add("verify_address", () => {
  cy.get_e2e("manageMembersBtn").click()
  cy.get_e2e("address").should('have.length', 2)
})

Cypress.Commands.add("test_user_reregistration", (userId) => {
  cy.wait(2000)
  cy.get_e2e("replaceUserButton-" + userId).should('be.visible').click()

  cy.get_e2e("replaceUserButton").click()

  cy.get_e2e("dismissButton").click()
  cy.manage_access_code(userId)
})

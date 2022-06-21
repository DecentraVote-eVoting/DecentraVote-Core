/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
describe('Login/Logout with admin credentials', () => {
  it('basic Login', () => {
    cy.visit("http://localhost:3999/app")
    cy.login("admin", "admin")
    cy.manualLogout()
  })
})

describe('Forgot Password with admin credentials', () => {
  it('recover password', () => {
    cy.visit("http://localhost:3999/app")

    cy.login("admin", "admin")

    cy.get_e2e("accountDropdownButton").click()
    cy.get_e2e("showMnemonicDropdownEntry").click({ force: true })

    cy.get_e2e("mnemonicTextArea").invoke("val").then(mnemonic => {
      cy.sessionLogout()
      cy.forgotPassword(mnemonic, "12345Abc")
      cy.manualLogout()
      cy.login("admin", "12345Abc")
    })
  })
})

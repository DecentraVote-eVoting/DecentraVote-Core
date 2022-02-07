/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
describe('Test user import and access code', () => {
  it('import and access code', () => {
    cy.register_users(1,0,0).then(users => {
      const admin_mnemonic = users.admins[0].mnemonic;

      cy.login(admin_mnemonic);
      cy.visit("http://localhost:3999/app")
      cy.reload()
      cy.import_users()

      cy.import_existing_users()
      cy.edit_users("hecino\\.peter\\@provider\\.com")

      cy.manage_access_code("fank\\.hgugo\\@provider\\.com")
      cy.login(admin_mnemonic);
      cy.visit("http://localhost:3999/app")

      cy.verify_address("fank\\.hgugo\\@provider\\.com")
      // Failed previously due to race condition: DECVO-800
      cy.test_user_reregistration("fank\\.hgugo\\@provider\\.com")
    })

  })
})

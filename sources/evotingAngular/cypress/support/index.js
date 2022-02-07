/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

//I run before every single test
beforeEach(() => {
  cy.request(Cypress.env("oracle_url") + "/api/e2e/reset");
  cy.request(Cypress.env("ballotbox_url") + "/api/e2e/reset");
  cy.request(Cypress.env("storage_url") + "/api/e2e/reset");
  //blockchain.reset()
})

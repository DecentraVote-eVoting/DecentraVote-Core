
// Background-Login; setting the mnemonic into the session storage
export function backgroundSessionLogin(mnemonic) {
  cy.log("Login with mnemonic: " + mnemonic);
  sessionStorage.setItem("decentravote-mnemonic", mnemonic);
}

// Background-Logout; remove session storage items and reload
export function backgroundSessionLogout() {
  sessionStorage.removeItem("decentravote-mnemonic");
  sessionStorage.removeItem("decentravote-mnemonic-encrypted");
  sessionStorage.removeItem("hashed_password");
  cy.reload();
}

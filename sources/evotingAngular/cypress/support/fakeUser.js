/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ethers} from "ethers";

var faker = require('faker');

export function getFakeUsers(numberOfAdmins, numberOfMembers, numberOfGuests) {
  let users = {};
  users.admins = [];
  users.members = [];
  users.guests = [];
  for (let i = 0; i < numberOfAdmins; i++) {
    let user = createUser(DIRECTOR + MEMBER);
    if (i === 0) {
      user.mnemonic = Cypress.env("admin_mnemonic");
      user.address = ethers.Wallet.fromMnemonic(user.mnemonic).address
    }
    users.admins.push(user);
  }
  for (let i = 0; i < numberOfMembers; i++) {
    let user = createUser(MEMBER);
    users.members.push(user);
  }
  for (let i = 0; i < numberOfGuests; i++) {
    let user = createUser(GUEST);
    users.guests.push(user);
  }
  return users;
}

function createUser(role) {
  let user = {}
  user.mnemonic = ethers.Wallet.createRandom().mnemonic.phrase;
  user.uid = faker.internet.email();
  user.name1 = faker.name.firstName();
  user.name2 = faker.name.lastName();
  user.address = ethers.Wallet.fromMnemonic(user.mnemonic).address
  user.role = role
  return user;
}

const NONE = 0b000;
const GUEST = 0b001;
const MEMBER = 0b010;
const DIRECTOR = 0b100;

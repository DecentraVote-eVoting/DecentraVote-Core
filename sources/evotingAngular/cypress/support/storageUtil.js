/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ethers} from "ethers";

export function getMultiDataParams(users) {
  let allUsers = [...users.admins, ...users.members, ...users.guests];
  let userMapping = allUsers.map(user => {
    return {
      'field0': user.field0,
      'field1': user.field1,
      'field2': user.field2,
      'salt': Math.random(),
      user
    }
  })

  userMapping  = userMapping.map((user) => {
    let originalUser = user.user;
    delete user.user;
    const stringified = JSON.stringify(user);
    const hash = ethers.utils.keccak256([...Buffer.from(stringified)]);
    originalUser.userClaim = hash;
    return {"hash": hash, "data": stringified}
  })

  const headers = {
    'Public': 'false'
  }

  return {
    headers,
    body: userMapping
  }
}

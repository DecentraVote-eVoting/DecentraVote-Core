/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ethers} from "ethers";
import organizationContractABI from '../../../solidity/target/generated/abi/com.iteratec.evoting.solidity.contracts/Organization.json'
import {NonceManager} from '@ethersproject/experimental';

let networkConfig;
const network =Cypress.env("network");
switch (network){
  case "local":
    networkConfig = require("../../../shared-resources/src/main/resources/local_config.json");
    break;
  case "bloxberg":
    networkConfig = require("../../../shared-resources/src/main/resources/bloxberg_config.json");
    break;
  case "epn":
    networkConfig = require("../../../shared-resources/src/main/resources/epn_config.json");
    break;
  default:
    throw Error("Could not detect network")
}

export const provider = new ethers.providers.JsonRpcProvider(networkConfig.httpRpcServer, {
  name: network,
  chainId: networkConfig.networkId,
  ensAddress: networkConfig.ensRegistryAddress
})
export const wallet = ethers.Wallet.fromMnemonic(Cypress.env("admin_mnemonic"));
export const signer = new NonceManager(wallet.connect(provider));
const organizationContract = new ethers.Contract(Cypress.env("environment") + ".decentravoteapp", organizationContractABI, signer)

export async function reset(){
  await organizationContract.reset([], [], [], {gasPrice: Cypress.env("gas_price"), gasLimit: Cypress.env("gas_limit")});
}

export function resetWithUsers(users){
  let allUsers = [...users.admins, ...users.members, ...users.guests];
  const entityAddresses = allUsers.map(user => user.address);
  const userClaims = allUsers.map(user => user.userClaim);
  const roles = allUsers.map(user => user.role);
  console.log("Starting Transaction")
  signer.setTransactionCount(signer.getTransactionCount())
  return organizationContract.reset(entityAddresses, userClaims, roles, {gasPrice: Cypress.env("gas_price"), gasLimit: Cypress.env("gas_limit")});
}

export async function getBlockNumber() {
  return await provider.getBlockNumber();
}

export async function signMessage(message) {
  return await wallet.signMessage(message);
}

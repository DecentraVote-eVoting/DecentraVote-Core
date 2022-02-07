# DecentraVote
### Copyright (C) 2018-2022 iteratec

# Getting Started

## Local Development
* install Ganache, Maven, und Node

### local first Blockchain setup
* start Ganache
* create new Workspace
   * Accounts & Keys
      * Enter Mnemonic to use
   * Chain (you can use your own preferences. example below)
      * Gas Limit -> 10000000
      * Gas Price -> 1000000

### Build Solidity
* `cd Solidity`
* `mvn -DskipTests=true install` (After every contract change you have to use this command)

### Deploy Solidity
* If you setup a new workspace in ganache, you have to delete the `local_config.json` in `shared-resources/src/main/resources`
* Set an environment variable MNEMONIC or insert in file frontend-deploy
* `cd SolidityDeployer`
* `npm i`
* `npm run deploy-dev` (Use `npm run deploy` to disable reseting of smart-contracts)

### Build Project
* `mvn -DskipTests=true install` (Only once necessary)

### Start Backends
* `cd docker`
* `docker-compose up -d`
* All Services: Add environment variable WEB3_MNEMONIC with your mnemonic or insert in the application.yml
* Oracle: Add environment variable PRIVATE_KEY with your private key to sign jwts or insert in the application.yml
* Ballotbox: Add environment variable LAMBDA_URL with an lambda endpoint to verify zkProofs or insert in the application.yml, you can also start the ballotbox without the lambda service and only check the zkProofs locally
* Start Storage with Active Profile `local`
* Start Ballotbox with Active Profile `local,sender,receiver`
* Start Oracle with Active Profile `local,token`
* For End-2-End Tests append the Active Profile `e2e`

### Deploy Assets
* Set an environment variable MNEMONIC or insert in file frontend-deploy
* `cd frontend-deploy`
* `npm i`
* `node frontend-deploy.js local assets`

### Start Frontend
* `cd evotingAngular`
* `npm i`
* `npm run start`

### Start E2E-Tests
* Deploy solidity with the flag: (`npm run deploy-dev`)
* Ballotbox, Storage and Oracle need the spring-profile: `e2e`
* Enable `Automine` for Ganache
* `cd evotingAngular`
* `npm run e2e`
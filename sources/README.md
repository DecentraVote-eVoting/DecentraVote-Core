# DecentraVote
### Copyright (C) 2018-2022 iteratec

# Getting Started

## Local Development
install Java,Maven and Node.js

recommended versions (could work with higher versions)
* java = 11/13
* maven = 3.6.3
* node = 12/14

### Build Solidity
* `cd Solidity`
* `mvn -DskipTests=true install` (After every contract change you have to use this command)

### Deploy Solidity
* Set an environment variable MNEMONIC or insert in file frontend-deploy (default: menu pretty waste ...)
* `cd SolidityDeployer`
* `npm i`
* `npm run development` to start a local ganache blockchain and deploy your contracts


* `npm run deploy` (if you only want to deploy a new contract)

### Build Project
* ``decentraVote root folder``
* `mvn -DskipTests=true install` (Only once necessary)

### Start Database

* `cd docker`
* `docker-compose up -d`

### Start Backends
  
1. All Services: Add environment variable WEB3_MNEMONIC with your mnemonic or insert in the application.yml (default: menu pretty waste ...)
2. Oracle: Add environment variable PRIVATE_KEY with your private key to sign jwts or insert in the application.yml (default: development pk)
3. Ballotbox: Add environment variable LAMBDA_URL with a lambda endpoint to verify zkProofs or insert in the application.yml, you can also start the ballotbox without the lambda service and only check the zkProofs locally (default: deployed aws lambda)


* Start Storage with Active Profile `local`
* Start Ballotbox with Active Profile `local,sender,receiver`
* Start Oracle with Active Profile `local,token`
* For End-2-End Tests append the Active Profile `e2e`

### Deploy Assets
* `cd frontend-deploy`
* Set an environment variable MNEMONIC or insert in file frontend-deploy (default: menu pretty waste ...)
* `npm i`
* `npm run local`

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
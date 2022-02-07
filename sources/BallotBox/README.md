DecentraVote
Copyright (C) 2018-2022 iteratec

# Relay Service
The purpose of the RelayService is to give clients the possibility to register anonymous addresses
to the smart contract in order to be able to vote anonymously. 
This is achieved by first having the client provide a Zero-Knowledge-Proof which is then sent
to the smart contract and validated. If the client provided a valid proof the anonymous address
which is part of the initial request, is then registered as an authorized address to enable the client
to vote with it.
### Installation
* ``mvn install`` - Installs all dependencies
### Configuration
* ``server.port`` - Defines the port on which the service runs
* ``api.requestMapping`` - Defines the rest api on which the service is listening for requests
* ``web3j.rpcServer`` - Defines the RPC Server to which the RelayService connects to
* ``web3j.contractAddress`` - Defines the address of Smart  Contract
* ``web3j.mnemonic`` - Defines the unique mnemonic with which ethereum addresses get generated
### Prerequisites
Before one can start the RelayService it is necessary to generate the needed web3j wrappers by running:
```
mvn web3j:generate-sources
```
### Usage
* ``mvn spring-boot:run`` - Starts the service
* ``mvn spring-boot:start`` - Starts the service detached
* ``mvn spring-boot:stop`` - Stops the detached service

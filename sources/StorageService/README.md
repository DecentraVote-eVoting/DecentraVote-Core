# DecentraVote
# Copyright (C) 2018-2022 iteratec

# Storage Service
TODO
### Installation
* ``mvn install`` - Installs all dependencies
### Configuration
##### Server
* ``server.port`` - Defines the port at which the service runs on
* ``server.url`` - Defines the public url under which the service is at
* ``api.requestMapping`` - Defines the rest api at which the service is listening for requests
##### Web3j
* ``web3j.rpcServer`` - Defines the RPC Server to which the RelayService connects to
* ``web3j.organizationAddress`` - Defines the address of the Smart Contract
* ``web3j.mnemonic`` - Defines the unique mnemonic with which ethereum addresses get generated
* ``web3j.derivationPathIndex`` - Defines which keypair derivation to use in regard to the mnemonic
### Usage
* ``mvn spring-boot:run`` - Starts the service
* ``mvn spring-boot:start`` - Starts the service detached
* ``mvn spring-boot:stop`` - Stops the detached service

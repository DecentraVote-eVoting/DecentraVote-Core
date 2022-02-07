/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.service

import com.iteratec.evoting.solidity.contracts.Organization
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.web3j.abi.datatypes.Address
import org.web3j.protocol.Web3j
import org.web3j.protocol.core.DefaultBlockParameterName
import org.web3j.protocol.core.methods.response.EthBlock

@Service
class OrganizationContractService(
    @Autowired
    val organization: Organization,
    @Autowired
    val web3j: Web3j
) {

    fun getUserRole(entityAddress: Address): Int {
        return organization.getUserRole(entityAddress).send().value.toInt()
    }

    fun isStorageServer(entityAddress: Address): Boolean {
        return organization.isStorage(entityAddress).send().value
    }

    fun isOracleServer(entityAddress: Address): Boolean {
        return organization.isOracle(entityAddress).send().value
    }

    fun isBallotBoxServer(entityAddress: Address): Boolean {
        return organization.isBallotBox(entityAddress).send().value
    }

    fun getCurrentBlock(): EthBlock {
        return web3j.ethGetBlockByNumber(DefaultBlockParameterName.LATEST, false).send()
    }

}

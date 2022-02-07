/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.service

import com.github.benmanes.caffeine.cache.Cache
import com.iteratec.evoting.ballotbox.configuration.Web3jConfig
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.web3j.abi.datatypes.Address

@Service
class OrganizationContractService(
    val web3: Web3jConfig,
    @Autowired val isVoteCache: Cache<Address, Boolean>,
) {

    fun isVote(address: Address): Boolean {
        return isVoteCache.get(address) {
            web3.organization().isVote(it).send().value
        }!!
    }

    fun clearCache(){
        isVoteCache.invalidateAll()
    }
}

/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.service

import com.github.benmanes.caffeine.cache.Cache
import com.google.gson.Gson
import com.iteratec.evoting.ballotbox.configuration.Web3jConfig
import com.iteratec.evoting.ballotbox.entities.RetryVoteEntity
import com.iteratec.evoting.ballotbox.extensions.toHash
import com.iteratec.evoting.ballotbox.extensions.unwrap
import com.iteratec.evoting.ballotbox.model.StorageData
import com.iteratec.evoting.ballotbox.model.VoteState
import com.iteratec.evoting.ballotbox.repository.AnonymousBallotRepository
import com.iteratec.evoting.ballotbox.repository.OpenBallotRepository
import com.iteratec.evoting.ballotbox.repository.RetryVoteRepository
import okhttp3.internal.EMPTY_BYTE_ARRAY
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.web3j.abi.datatypes.Address
import org.web3j.abi.datatypes.generated.Bytes32
import org.web3j.utils.Numeric
import java.util.concurrent.TimeUnit
import javax.transaction.Transactional

@Service
class VoteContractService(
    val web3: Web3jConfig,
    val storageService: StorageService,
    val openBallotRepository: OpenBallotRepository,
    val anonymousBallotRepository: AnonymousBallotRepository,
    val retryVoteRepository: RetryVoteRepository,
    @Autowired val voteStageCache: Cache<String, VoteState>,
) {
    private val logger: Logger = LoggerFactory.getLogger(VoteContractService::class.java)

    @Synchronized
    @Transactional
    fun sendVotes(voteAddress: String, anonymousVote: Boolean, cronJob: Boolean = false): Boolean {
        if (treeHashAlreadyCommitted(voteAddress)) {
            logger.debug("treehash for vote $voteAddress already committed")
            return true
        }

        val numberOfRetries = 3
        for (i in 1..numberOfRetries) {
            logger.debug("try to send Vote $voteAddress to Storage")
            try {
                val vote = if (anonymousVote) {
                    anonymousBallotRepository.findAllByVoteAddress(voteAddress).unwrap()?.map {
                        it.toModel()
                    }
                } else {
                    openBallotRepository.findAllByVoteAddress(voteAddress).unwrap()?.map {
                        it.toModel()
                    }
                }

                val data = if (vote.isNullOrEmpty()) {
                    Gson().toJson(EMPTY_BYTE_ARRAY)
                } else {
                    Gson().toJson(vote)
                }

                storageService.sendDataToStorage(StorageData(data.toHash(), data))
                web3.voteContract(voteAddress)
                    .commitTreeHash(Bytes32(Numeric.hexStringToByteArray(data.toHash())))
                    .send()
                logger.info("Treehash for vote $voteAddress committed.")
                break
            } catch (e: Exception) {
                logger.error(e.message)
                TimeUnit.SECONDS.sleep(5)
            }

            if (i == numberOfRetries && cronJob) return false

            if (i == numberOfRetries) {
                logger.info("Storage is not available. Moving vote to scheduled cronjob.")
                val retryVote = RetryVoteEntity(voteAddress, anonymousVote)
                retryVoteRepository.save(retryVote)
                return false
            }
        }
        return true
    }

    fun getVoteState(voteAddress: String): VoteState {
        return voteStageCache.get(voteAddress) {
            val voteState = web3.voteContract(it).ballotBoxState().send()
            VoteState(
                root = voteState.component1().value,
                stage = voteState.component2().value,
                anonymous = voteState.component3().value
            )
        }!!
    }

    fun getNumberOfVotingRights(voteAddress: String, entityAddress: Address): Int {
        return web3.voteContract(voteAddress).getNumberOfVotingRights(entityAddress).send().value.toInt()
    }

    fun treeHashAlreadyCommitted(voteAddress: String): Boolean {
        return web3.voteContract(voteAddress).treeHashAlreadyCommitted.send().value
    }
}

/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.service

import com.iteratec.evoting.ballotbox.configuration.BallotBoxProfiles
import com.iteratec.evoting.ballotbox.configuration.Web3jConfig
import com.iteratec.evoting.solidity.contracts.EventManager
import com.iteratec.evoting.solidity.contracts.Organization
import io.reactivex.Flowable
import io.reactivex.disposables.Disposable
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import org.web3j.protocol.Web3j
import org.web3j.protocol.core.DefaultBlockParameterName
import org.web3j.tx.FastRawTransactionManager
import org.web3j.tx.gas.StaticGasProvider

@Service
@Profile(BallotBoxProfiles.SENDER)
class EventManagerService(
        private val organizationContract: Organization,
        private val web3j: Web3j,
        private val txManager: FastRawTransactionManager,
        private val voteContractService: VoteContractService,
        private val web3jConfig: Web3jConfig
) {
    private final val logger: Logger = LoggerFactory.getLogger(EventManagerService::class.java)
    private lateinit var eventManager: EventManager

    private var subscription: Flowable<EventManager.VoteClosedEventResponse>? = null
    private var disposable: Disposable? = null

    init {
        initEventManager()
    }

    final fun initEventManager() {
        val eventManagerAddress = organizationContract.eventManager().send().value
        eventManager = EventManager.load(
                eventManagerAddress,
                web3j,
                txManager,
                StaticGasProvider(web3jConfig.profile.gasPrice, web3jConfig.profile.gasLimit)
        )
        logger.debug("subscribing to vote closed event.")
        subscription = eventManager.voteClosedEventFlowable(DefaultBlockParameterName.EARLIEST, DefaultBlockParameterName.LATEST)

        disposable = subscription?.subscribe({ eventResponse ->
            voteContractService.sendVotes(
                    eventResponse.voteAddress.value,
                    eventResponse.anon.value
            )
        }, { error -> logger.warn("Error receiving event: ${error.message}") }
        )
    }

    fun closeSubscription() {
        disposable?.dispose()
    }
}

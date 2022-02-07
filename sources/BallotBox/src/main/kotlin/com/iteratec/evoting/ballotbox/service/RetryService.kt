/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.service

import com.iteratec.evoting.ballotbox.configuration.BallotBoxProfiles
import com.iteratec.evoting.ballotbox.repository.RetryVoteRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Profile(BallotBoxProfiles.SENDER)
@Component
@EnableScheduling
class RetryService(
        val retryVoteRepository: RetryVoteRepository,
        private val voteContractService: VoteContractService,
        private val eventManagerService: EventManagerService
        ) {
    private val logger: Logger = LoggerFactory.getLogger(RetryService::class.java)

    // cron job to be executed every 5 minutes
    @Scheduled(cron = "0 */5 * ? * *")
    fun run() {
        logger.debug("cron job running!")
        val votesToProcess = retryVoteRepository.findAll()
        for (vote in votesToProcess) {
            val success = voteContractService.sendVotes(vote.voteAddress, vote.anonymousVote, cronJob = true)
            if (success) {
                retryVoteRepository.deleteById(vote.id!!)
                logger.info("Vote ${vote.voteAddress} successfully processed")
            }
        }
    }

    // Cron job to check for subscription to event Vote Close
    @Scheduled(cron = "0 */2 * ? * *")
    fun eventSubscription() {
        try {
            eventManagerService.closeSubscription()
        } catch (e: Exception) {
            logger.trace("Subscription already disposed")
        }
        eventManagerService.initEventManager()
    }
}

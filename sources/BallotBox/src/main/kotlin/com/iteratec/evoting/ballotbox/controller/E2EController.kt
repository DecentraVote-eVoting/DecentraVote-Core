/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.controller

import com.iteratec.evoting.ballotbox.configuration.Web3jConfig
import com.iteratec.evoting.ballotbox.repository.OpenBallotRepository
import com.iteratec.evoting.ballotbox.service.EventManagerService
import com.iteratec.evoting.ballotbox.service.OrganizationContractService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Profile
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/e2e")
@Profile("e2e")
class E2EController(
    @Autowired
    val openBallotRepository: OpenBallotRepository,
    @Autowired
    val organizationContractService: OrganizationContractService,
    @Autowired
    val web3jConfig: Web3jConfig,
    @Autowired
    val eventManagerService: EventManagerService
) {

    val logger: Logger = LoggerFactory.getLogger(E2EController::class.java)

    @GetMapping("/reset")
    fun resetState(){
        logger.info("Reset Request!")
        return try{
            openBallotRepository.deleteAll()
            organizationContractService.clearCache()
            web3jConfig.resetNonce()
        } catch (e: Exception){

        }
    }

    @GetMapping("/resetEventManager")
    fun resetEventManager(){
        logger.info("Reset EventManager Request!")
        return try {
            eventManagerService.initEventManager()
        } catch (e: Exception) {
            print(e.message)
        }
    }

}

/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle

import com.iteratec.evoting.oracle.configuration.Web3jConfig
import com.iteratec.evoting.oracle.service.AccountService
import com.iteratec.evoting.oracle.service.ReimportService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.boot.runApplication
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling
import java.util.concurrent.TimeUnit

@EnableAsync
@EnableScheduling
@SpringBootApplication(exclude= [UserDetailsServiceAutoConfiguration::class])
class OracleApplication(
        val reimportService: ReimportService,
        val accountService: AccountService,
        val web3jConfig: Web3jConfig
) {
    val logger: Logger = LoggerFactory.getLogger(OracleApplication::class.java)

    @Value("\${Member.reimport}")
    val reimport: Boolean = false

    @Value("\${Member.registerAdministrator}")
    val registerAdministrator: Boolean = false

    @EventListener(ApplicationReadyEvent::class)
    fun startUpConfigurations() {
        try {
            TimeUnit.SECONDS.sleep(10)
        } catch (ie: Exception) {
            Thread.currentThread().interrupt()
        }
        try {
            if (reimportService.isEmptyContract() && reimport) {
                reimportService.reimportUser()
            }
        } catch (ex: Exception) {
            logger.warn("Reimport failure: Reason: ${ex.message}")
        }
        try {
            if (registerAdministrator) {
                val directorAddress = web3jConfig.firstDerivedAddress()
                accountService.registerInitialDirector(directorAddress)
            }
        } catch (ex: Exception) {
            logger.warn("Register Admin failure: Reason: ${ex.message}")
        }
    }
}

fun main(args: Array<String>) {
    runApplication<OracleApplication>(*args)
}
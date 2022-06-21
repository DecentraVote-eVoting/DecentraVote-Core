/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.controller

import com.iteratec.evoting.storageservice.configuration.Web3jConfig
import com.iteratec.evoting.storageservice.dto.StorageData
import com.iteratec.evoting.storageservice.service.StorageService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/e2e")
@Profile("e2e")
class E2EController(
        @Value("\${assetFile:}")
        val assetFile: String = "",
        @Value("\${assetArgument1:}")
        val assetArgument1: String = "",
        @Value("\${assetArgument2:}")
        val assetArgument2: String = "",
        @Autowired
        val storageService: StorageService,
        @Autowired
        val web3jConfig: Web3jConfig,
) {

    val logger: Logger = LoggerFactory.getLogger(StorageController::class.java)

    @GetMapping("/reset")
    fun resetState(): ResponseEntity<String> {
        logger.debug("Reset Request!")
        return try {
            this.storageService.deleteAllData()
            this.web3jConfig.resetNonce()
            ResponseEntity.ok("Storage successfully reset")
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }

    @CrossOrigin
    @PostMapping("/save")
    fun saveData(
            @RequestHeader("Public") public: Boolean?,
            @RequestBody dataList: List<StorageData>,
    ): ResponseEntity<*> {
        logger.info("E2E save was invoked");
        val publicResource = public ?: false

        if (dataList.filterNot(StorageData::checkHash).isNotEmpty())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Request Hashes are not equal to Data Hashes")

        return try {
            dataList.forEach { storageService.saveData(it, publicResource) }
            ResponseEntity.ok("")
        } catch (e: Exception) {
            logger.error("Error saving values")
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
        }

    }

    @GetMapping("/assets")
    fun deployAssets(): ResponseEntity<String> {
        logger.debug("Assets Request!")
        return try {
            ProcessBuilder("node", assetFile, assetArgument1, assetArgument2)
                    .redirectOutput(ProcessBuilder.Redirect.INHERIT)
                    .redirectError(ProcessBuilder.Redirect.INHERIT)
                    .start()
                    .waitFor()

            //TODO: Find a way to only send ok when assets where actually successfully deployed
            ResponseEntity.ok("Assets successfully deployed")
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
}

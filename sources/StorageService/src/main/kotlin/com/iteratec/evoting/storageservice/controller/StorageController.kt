/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.controller

import com.iteratec.evoting.storageservice.dto.StorageData
import com.iteratec.evoting.storageservice.exceptions.DataEntryNotFoundException
import com.iteratec.evoting.storageservice.exceptions.PrivateDataPermissionDeniedException
import com.iteratec.evoting.storageservice.models.Signature
import com.iteratec.evoting.storageservice.service.SignatureService
import com.iteratec.evoting.storageservice.service.StorageService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/storage")
class StorageController(
    val storageService: StorageService,
    val signatureService: SignatureService
) {

    val logger: Logger = LoggerFactory.getLogger(StorageController::class.java)

    @CrossOrigin
    @PostMapping("/save")
    fun saveData(
        @RequestHeader("Signature") signatureString: String?,
        @RequestHeader("Message") message: String?,
        @RequestHeader("Public") public: Boolean?,
        @RequestBody dataList: List<StorageData>
    ): ResponseEntity<*> {
        val signature = Signature(signatureString ?: "", message ?: "")
        val publicResource = public ?: false

        if (dataList.filterNot(StorageData::checkSize).isNotEmpty())
            throw ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Data received exceeds maximum size")

        if (dataList.filterNot(StorageData::checkHash).isNotEmpty())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Request Hashes are not equal to Data Hashes")

        return if (signatureService.isAllowedToWriteData(signature)) {
            try {
                dataList.forEach { storageService.saveData(it, publicResource) }
                ResponseEntity.ok("")
            } catch (e: Exception) {
                logger.error("Error saving values")
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
            }
        } else {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Signature not valid")
        }
    }

    @CrossOrigin
    @PostMapping("/get")
    fun getData(
        @RequestHeader("Signature") signatureString: String?,
        @RequestHeader("Message") message: String?,
        @RequestHeader("Public") public: Boolean?,
        @RequestBody hashes: List<String>
    ): ResponseEntity<List<StorageData>> {
        val signature = Signature(signatureString ?: "", message ?: "")
        val publicResource = public ?: true
        val sha3Regex = Regex("^0x[a-fA-F0-9]{64}\$")


        // try catch as to circumvent bug where hashes (List<String>) could be null
        try {
            if (hashes.filterNot(sha3Regex::matches).isNotEmpty())
                throw Exception("Request Hashes are not valid hashes")
        } catch (e: Exception) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, e.message)
        }

        return if (publicResource || signatureService.isAllowedToReadData(signature)) {
            try {
                val data: List<StorageData> = storageService.getData(hashes, publicResource)
                if (data.isEmpty()) throw DataEntryNotFoundException(hashes.toString())
                ResponseEntity.ok(data)
            } catch (e: DataEntryNotFoundException) {
                logger.debug("Hashes not found: ${e.hash}")
                throw ResponseStatusException(HttpStatus.NOT_FOUND)
            } catch (e: PrivateDataPermissionDeniedException) {
                logger.error("Access denied for hash: ${e.hash}")
                throw ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Not allowed to access private data without a valid signature"
                )
            } catch (e: Exception) {
                logger.error("Error getting values for given hashes!")
                logger.error("${e.cause}")
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.message)
            }
        } else
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Signature not valid")
    }

}

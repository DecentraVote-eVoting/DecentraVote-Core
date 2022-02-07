/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.github.kittinunf.fuel.core.extensions.jsonBody
import com.github.kittinunf.fuel.httpPost
import com.github.kittinunf.result.Result
import com.google.gson.Gson
import com.iteratec.evoting.oracle.extensions.toHash
import com.iteratec.evoting.oracle.models.Account
import com.iteratec.evoting.oracle.models.StorageData
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class StorageService(
    val signatureService: SignatureService
) {
    val logger: Logger = LoggerFactory.getLogger(StorageService::class.java)

    @Value("\${storageService.url}")
    val storageServiceUrl: String? = null

    fun sendMembershipClaimToStorage(account: Account, claim: String) {
        val data = StorageData(claim.toHash(), claim)
        val signature = signatureService.createSignature()
        // TODO get storage url from event and send to random storage
        val (_, _, result) = "$storageServiceUrl/api/storage/save"
            .httpPost()
            .header("Signature", signature.signature)
            .header("Message", signature.message)
            .header("Public", false)
            .jsonBody(Gson().toJson(listOf(data)))
            .responseString()

        when (result) {
            is Result.Failure -> {
                throw Exception(
                    "${result.error.message}: STORAGE HTTP POST FAILED! URL: $storageServiceUrl/api/storage/save"
                )
            }
            is Result.Success -> {
                logger.info("HTTP POST SUCCESS: $storageServiceUrl/api/storage/save - ETH ADR: ${account.address} - HASH VALUE: ${data.hash}")
            }
        }
    }
}

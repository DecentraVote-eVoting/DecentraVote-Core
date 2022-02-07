/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.service

import com.github.kittinunf.fuel.core.extensions.jsonBody
import com.github.kittinunf.fuel.httpPost
import com.github.kittinunf.result.Result
import com.google.gson.Gson
import com.iteratec.evoting.ballotbox.configuration.BallotBoxProfiles
import com.iteratec.evoting.ballotbox.model.ZKProof
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service

@Service
@Profile(BallotBoxProfiles.LAMBDA)
class LambdaVerifierService : IVerifierService {

    @Value("\${aws.lambda.url}")
    val lambdaURL: String? = null

    override fun verifyProof(zkproof: ZKProof): Boolean {
        return when (lambdaURL?.httpPost()?.jsonBody(Gson().toJson(zkproof))?.responseString()?.third) {
            is Result.Failure -> false
            is Result.Success -> true
            else -> false
        }
    }
}

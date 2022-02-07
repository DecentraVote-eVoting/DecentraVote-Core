/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.model

import com.google.gson.Gson
import com.iteratec.evoting.ballotbox.entities.ZKProofEntity


data class ZKProof(
        var proof: ZKProofPoints,
        var publicSignals: List<String>,
) {
    fun anonymousAddress(): String {
        return publicSignals[0]
    }

    fun root(): String {
        return publicSignals[1]
    }

    fun index(): String {
        return publicSignals[2]
    }

    fun nullifier(): String {
        return publicSignals[3]
    }

    fun toEntity(): ZKProofEntity {
        return ZKProofEntity(
                proof = Gson().toJson(proof),
                anonymousAddress = anonymousAddress(),
                root = root(),
                index = index(),
                nullifier = nullifier()
        )
    }
}

data class ZKProofPoints(
        val pi_a: List<String>,
        val pi_b: List<List<String>>,
        val pi_c: List<String>,
        val protocol: String?,
)

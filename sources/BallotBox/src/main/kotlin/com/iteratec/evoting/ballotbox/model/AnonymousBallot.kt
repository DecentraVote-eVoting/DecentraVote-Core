/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.model

import com.iteratec.evoting.ballotbox.entities.AnonymousBallotEntity

class AnonymousBallot(
        var zkProof: ZKProof,
        var signedDecision: SignedJsonString
) {
    fun toEntity(voteAddress: String): AnonymousBallotEntity {
        return AnonymousBallotEntity(
                voteAddress = voteAddress,
                zkProof = zkProof.toEntity(),
                signedDecision = signedDecision.toSignedDecisionEntity()
        )
    }
}
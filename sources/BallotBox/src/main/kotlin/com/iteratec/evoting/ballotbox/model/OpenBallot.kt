/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.model

import com.iteratec.evoting.ballotbox.entities.OpenBallotEntity

class OpenBallot(
        var signedNullifier: SignedJsonString,
        var signedDecision: SignedJsonString
) {
    fun toEntity(voteAddress: String): OpenBallotEntity {
        return OpenBallotEntity(
                voteAddress = voteAddress,
                signedNullifier = signedNullifier.toSignedNullifierEntity(),
                signedDecision = signedDecision.toSignedDecisionEntity()
        )
    }
}
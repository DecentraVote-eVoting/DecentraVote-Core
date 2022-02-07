/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.entities

import com.iteratec.evoting.ballotbox.model.SignedJsonString
import java.io.Serializable
import javax.persistence.Column
import javax.persistence.Embeddable

@Embeddable
data class SignedDecisionEntity(
        @Column
        val decisionSignature: String,
        @Column(name = "decision_json", columnDefinition = "TEXT")
        val decision: String,
        @Column(name = "decision_signer")
        val signer: String,
) : Serializable {
    fun toModel(): SignedJsonString {
        return SignedJsonString(
                decisionSignature,
                decision
        )
    }
}

@Embeddable
data class SignedNullifierEntity(
        @Column
        val nullifierSignature: String,
        @Column(name = "nullifier_json", columnDefinition = "TEXT")
        val nullifier: String,
        @Column(name = "nullifier_signer")
        val signer: String,
) : Serializable {
    fun toModel(): SignedJsonString {
        return SignedJsonString(
                nullifierSignature,
                nullifier
        )
    }
}
/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.entities

import com.iteratec.evoting.ballotbox.model.OpenBallot
import javax.persistence.*

@Entity()
@Table(
        name = "t_open_ballot",
        uniqueConstraints = [
            UniqueConstraint(columnNames = [ "vote_address", "nullifier_json" ])
        ]
)
@SequenceGenerator(name = "seq", initialValue = 1, allocationSize = 1)
data class OpenBallotEntity(
        @Id
        @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq")
        @Column(name = "ballot_id")
        var id: Long? = null,

        @Column(name = "vote_address")
        var voteAddress: String,

        @Embedded()
        var signedNullifier: SignedNullifierEntity,

        @Embedded()
        var signedDecision: SignedDecisionEntity
) {
    fun toModel(): OpenBallot {
        return OpenBallot(
                signedNullifier = signedNullifier.toModel(),
                signedDecision = signedDecision.toModel()
        )
    }
}

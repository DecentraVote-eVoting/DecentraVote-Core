/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.entities

import com.iteratec.evoting.ballotbox.model.AnonymousBallot
import javax.persistence.*

@Entity()
@Table(
        name = "t_anonymous_ballot",
        uniqueConstraints = [
            UniqueConstraint(columnNames = [ "vote_address", "zk_nullifier" ], name = "vote_address_nullifier_unique")
        ]
)
@SequenceGenerator(name="anonymous_ballot_seq_generator",
        sequenceName="anonymous_ballot_seq",
        allocationSize=1)
data class AnonymousBallotEntity(
        @Id
        @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "anonymous_ballot_seq_generator")
        @Column(name = "ballot_id")
        var id: Long? = null,

        @Column(name = "vote_address")
        var voteAddress: String,

        @Embedded()
        var zkProof: ZKProofEntity,

        @Embedded()
        var signedDecision: SignedDecisionEntity
) {
    fun toModel(): AnonymousBallot {
        return AnonymousBallot(
                zkProof = zkProof.toModel(),
                signedDecision = signedDecision.toModel()
        )
    }
}

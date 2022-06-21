/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.entities

import javax.persistence.*

@Entity
@Table(name = "t_retry")
@SequenceGenerator(name="retry_seq_generator",
        sequenceName="retry_seq",
        allocationSize=1)
data class RetryVoteEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE,
            generator="retry_seq_generator")
    var id: Long? = null,
    val voteAddress: String,
    val anonymousVote: Boolean
) {
    constructor(voteAddress: String, anonymousVote: Boolean) : this(null, voteAddress, anonymousVote)
}

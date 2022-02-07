/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.entities

import javax.persistence.*

@Entity
@Table(name = "t_retry")
data class RetryVoteEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
    val voteAddress: String,
    val anonymousVote: Boolean
) {
    constructor(voteAddress: String, anonymousVote: Boolean) : this(null, voteAddress, anonymousVote)
}

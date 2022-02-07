/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.repository

import com.iteratec.evoting.ballotbox.entities.AnonymousBallotEntity
import org.springframework.data.repository.CrudRepository
import java.util.*

interface AnonymousBallotRepository : CrudRepository<AnonymousBallotEntity, Long> {

    fun countAllByVoteAddress(voteAddress: String): Number

    fun findAllByVoteAddress(voteAddress: String): Optional<List<AnonymousBallotEntity>>
}
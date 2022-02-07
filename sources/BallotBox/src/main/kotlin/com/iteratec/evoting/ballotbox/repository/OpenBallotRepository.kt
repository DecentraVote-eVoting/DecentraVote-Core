/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.repository

import com.iteratec.evoting.ballotbox.entities.OpenBallotEntity
import org.springframework.data.repository.CrudRepository
import java.util.*

interface OpenBallotRepository : CrudRepository<OpenBallotEntity, Long> {

    fun countAllByVoteAddress(voteAddress: String): Number

    fun findAllByVoteAddress(voteAddress: String): Optional<List<OpenBallotEntity>>

    fun findAllByVoteAddressAndSignedDecisionSigner(voteAddress: String, signer: String): Optional<List<OpenBallotEntity>>

    fun findByVoteAddressAndSignedNullifierNullifier (voteAddress: String, nullifier: String) : Optional<OpenBallotEntity>
}

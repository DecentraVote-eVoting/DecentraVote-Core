/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.repository

import com.iteratec.evoting.ballotbox.entities.RetryVoteEntity
import org.springframework.data.repository.CrudRepository

interface RetryVoteRepository : CrudRepository<RetryVoteEntity, Long>

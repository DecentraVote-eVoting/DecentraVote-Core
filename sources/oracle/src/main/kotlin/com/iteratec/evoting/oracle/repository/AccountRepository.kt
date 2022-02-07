/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.repository

import com.iteratec.evoting.oracle.entities.AccountEntity
import org.springframework.data.repository.CrudRepository
import java.util.*

interface AccountRepository : CrudRepository<AccountEntity, String> {

    fun findByAddress(address: String): Optional<AccountEntity>
}

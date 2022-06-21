/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.repository

import com.iteratec.evoting.oracle.entities.MnemonicEntity
import org.springframework.data.repository.CrudRepository
import java.util.*

interface MnemonicRepository : CrudRepository<MnemonicEntity, Long> {

    fun findByUsername(username: String): Optional<MnemonicEntity>

    fun findByAddress(address: String): Optional<MnemonicEntity>
}
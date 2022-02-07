/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.data

import com.iteratec.evoting.storageservice.entities.DataEntry
import org.springframework.data.repository.CrudRepository
import org.springframework.data.rest.core.annotation.RestResource
import javax.transaction.Transactional

@RestResource(exported = false)
interface DataEntryRepository : CrudRepository<DataEntry, String> {
    @Transactional
    fun findAllByHashInAndPublicIsTrue(hashes: List<String>): List<DataEntry>
    fun deleteDataEntriesByPublicIsFalse()
}

/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.service

import com.github.benmanes.caffeine.cache.Cache
import com.iteratec.evoting.storageservice.data.DataEntryRepository
import com.iteratec.evoting.storageservice.dto.StorageData
import com.iteratec.evoting.storageservice.entities.DataEntry
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class StorageService(
        @Autowired
        val dataEntryRepository: DataEntryRepository,
        @Autowired val dataCache: Cache<String, DataEntry>
        ) {

    @Transactional
    @Synchronized
    fun saveData(data: StorageData, publicResource: Boolean) {
        if (!dataEntryRepository.existsById(data.hash)) {
            dataCache.invalidate(data.hash)
            dataEntryRepository.save(DataEntry(data.hash, data.data, publicResource))
        }
    }

    fun getData(hashes: List<String>, publicResource: Boolean): List<StorageData> {
        return if (publicResource) {
            dataEntryRepository.findAllByHashInAndPublicIsTrue(hashes).map(DataEntry::toStorageData)
        } else {
            dataEntryRepository.findAllById(hashes).map(DataEntry::toStorageData)
        }
    }

    @Transactional
    fun deleteAllData() {
        dataEntryRepository.deleteDataEntriesByPublicIsFalse()
    }
}

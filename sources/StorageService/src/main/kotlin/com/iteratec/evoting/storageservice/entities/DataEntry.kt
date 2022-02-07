/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.entities

import com.iteratec.evoting.storageservice.dto.StorageData
import javax.persistence.Column
import javax.persistence.Entity
import javax.persistence.Id
import javax.persistence.Lob

@Entity
class DataEntry(
    @Id
    val hash: String,
    @Lob
    val data: String,
    @Column
    val public: Boolean?
) {
    fun toStorageData(): StorageData {
        return StorageData(hash, data)
    }
}

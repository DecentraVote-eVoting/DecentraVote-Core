/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.dto

import com.iteratec.evoting.storageservice.extensions.toHash

data class StorageData (
    val hash: String,
    val data: String
){
    fun checkHash(): Boolean {
        return data.toHash() == hash
    }

    fun checkSize(): Boolean {
        return data.toByteArray().size < 25000000
    }
}

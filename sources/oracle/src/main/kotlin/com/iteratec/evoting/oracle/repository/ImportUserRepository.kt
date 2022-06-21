/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.repository

import com.iteratec.evoting.oracle.entities.ImportUser
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.CrudRepository
import java.util.*

interface ImportUserRepository : CrudRepository<ImportUser, Long> {
    fun getByUid(uid: String): Optional<ImportUser>
    fun getByAccessCode(accessCode: String): Optional<ImportUser>

    @Query(value = "SELECT count(user) FROM ImportUser user WHERE user.uid IN (:uidarray) AND user.role != 0 AND user.used = FALSE")
    fun getNumberOfDuplicateUids(uidarray: List<String>): Int
}

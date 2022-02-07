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
    fun getByField0(field0: String): Optional<ImportUser>
    fun getByAccessCode(accessCode: String): Optional<ImportUser>

    @Query(value = "SELECT count(user) FROM ImportUser user WHERE user.field0 IN (:field0array) AND user.role != 0 AND user.used = FALSE")
    fun getNumberOfDuplicateField0s(field0array: List<String>): Int
}

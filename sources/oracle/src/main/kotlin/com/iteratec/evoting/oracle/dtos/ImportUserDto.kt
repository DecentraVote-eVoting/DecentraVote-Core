/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.dtos

import com.iteratec.evoting.oracle.entities.ImportUser
import java.sql.Timestamp
import java.time.Instant

abstract class ImportUserDataTransferObject {
    abstract val id: Long
    abstract val field1: String
    abstract val field2: String
    abstract val field0: String
    abstract val role: Int
    abstract val validUntil: Timestamp
}

data class ImportUserDto(
        override val id: Long,
        override val field1: String,
        override val field2: String,
        override val field0: String,
        override val role: Int,
        override val validUntil: Timestamp
) : ImportUserDataTransferObject() {
    object ModelMapper {
        fun mapFromImportUser(user: ImportUser) =
                ImportUserDto(
                        user.id!!,
                        user.field1!!,
                        user.field2!!,
                        user.field0!!,
                        user.role!!,
                        user.validUntil?: Timestamp.from(Instant.MIN)
                )
    }
}

data class ImportUserWithAccessCodeDto(
        override val id: Long,
        override val field1: String,
        override val field2: String,
        override val field0: String,
        override val role: Int,
        override val validUntil: Timestamp,
        val accessCode: String
) : ImportUserDataTransferObject()  {
    object ModelMapper {
        fun mapFromImportUser(user: ImportUser) =
                ImportUserWithAccessCodeDto(
                        user.id!!,
                        user.field1!!,
                        user.field2!!,
                        user.field0!!,
                        user.role!!,
                        user.validUntil?: Timestamp.from(Instant.MIN),
                        user.accessCode!!)
    }
}

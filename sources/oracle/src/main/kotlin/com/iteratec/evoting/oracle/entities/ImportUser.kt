/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.entities

import java.sql.Timestamp
import javax.persistence.Column
import javax.persistence.Entity
import javax.persistence.GeneratedValue
import javax.persistence.Id


@Entity
class ImportUser {

        @Id
        @GeneratedValue
        var id: Long? = null

        @Column
        var field1: String? = null

        @Column
        var field2: String? = null

        @Column(unique = true)
        var field0: String? = null

        @Column
        var accessCode: String? = null

        @Column
        var used: Boolean = false

        @Column
        var validUntil: Timestamp? = null

        @Column
        var role: Int? = null
}
